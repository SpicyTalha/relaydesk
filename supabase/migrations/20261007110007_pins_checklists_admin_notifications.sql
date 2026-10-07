-- Round two: red-pen pins on the work, resolving feedback, AI revision checklists,
-- in-app notifications and the platform admin's audit log.
-- Same rules as the core schema: RLS on, explicit grants, state changes through
-- SECURITY DEFINER functions that check auth.uid() themselves.

-- ---------------------------------------------------------------------------
-- Pins: a comment can mark a spot on a version's image (0..1 of its width/height).
-- ---------------------------------------------------------------------------

alter table public.comments
  add column pin_x numeric(5, 4),
  add column pin_y numeric(5, 4),
  add column resolved_at timestamptz,
  add column resolved_by uuid references auth.users (id) on delete set null,
  add constraint comment_pin_shape check (
    (pin_x is null and pin_y is null)
    or (pin_x between 0 and 1 and pin_y between 0 and 1 and version_id is not null)
  );

grant insert (pin_x, pin_y) on public.comments to authenticated;

-- The team marks feedback as dealt with. Clients can't, and nobody edits it any other way.
create function public.set_comment_resolved(p_comment uuid, p_resolved boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_ws uuid;
begin
  select workspace_id into v_ws from public.comments where id = p_comment and deleted_at is null;
  if v_ws is null or not private.is_team_member(v_ws) then
    raise exception 'Only your studio can resolve feedback.' using errcode = '42501';
  end if;
  update public.comments
     set resolved_at = case when p_resolved then now() else null end,
         resolved_by = case when p_resolved then auth.uid() else null end
   where id = p_comment;
end;
$$;

revoke all on function public.set_comment_resolved(uuid, boolean) from public;
grant execute on function public.set_comment_resolved(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- AI revision checklists (team only). Plans cap how many a studio makes a month.
-- ---------------------------------------------------------------------------

create or replace function private.plan_limit(p public.plan_tier, what text)
returns bigint
language sql immutable set search_path = ''
as $$
  select case what
    when 'clients' then case p when 'free' then 2 when 'pro' then 15 else null end
    when 'team' then case p when 'free' then 2 when 'pro' then 10 else null end
    when 'storage_bytes' then case p when 'free' then 262144000 when 'pro' then 21474836480 else 107374182400 end
    when 'ai_per_month' then case p when 'free' then 0 when 'pro' then 50 else 300 end
  end;
$$;

create table public.revision_checklists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  client_id uuid not null,
  deliverable_id uuid not null,
  version_id uuid references public.deliverable_versions (id) on delete set null,
  model text not null check (char_length(model) <= 120),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  foreign key (deliverable_id, workspace_id, client_id)
    references public.deliverables (id, workspace_id, client_id) on delete cascade,
  unique (id, workspace_id)
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null,
  workspace_id uuid not null,
  position smallint not null check (position between 0 and 49),
  body text not null check (char_length(btrim(body)) between 1 and 300),
  quote text not null default '' check (char_length(quote) <= 600),
  comment_id uuid references public.comments (id) on delete set null,
  done_at timestamptz,
  done_by uuid references auth.users (id) on delete set null,
  foreign key (checklist_id, workspace_id) references public.revision_checklists (id, workspace_id) on delete cascade,
  unique (checklist_id, position)
);

create index revision_checklists_deliverable_idx on public.revision_checklists (deliverable_id, created_at desc);
create index revision_checklists_month_idx on public.revision_checklists (workspace_id, created_at);
create index checklist_items_checklist_idx on public.checklist_items (checklist_id, position);

alter table public.revision_checklists enable row level security;
alter table public.checklist_items enable row level security;

create policy "Team sees its checklists" on public.revision_checklists for select to authenticated
  using ((select private.is_team_member(workspace_id)));
create policy "Team makes checklists" on public.revision_checklists for insert to authenticated
  with check ((select private.is_team_member(workspace_id)) and created_by = (select auth.uid()));
create policy "Team sees checklist items" on public.checklist_items for select to authenticated
  using ((select private.is_team_member(workspace_id)));
create policy "Team adds checklist items" on public.checklist_items for insert to authenticated
  with check ((select private.is_team_member(workspace_id)) and done_at is null);
create policy "Team ticks checklist items" on public.checklist_items for update to authenticated
  using ((select private.is_team_member(workspace_id)))
  with check ((select private.is_team_member(workspace_id)));

grant select on public.revision_checklists, public.checklist_items to authenticated;
grant insert (workspace_id, client_id, deliverable_id, version_id, model) on public.revision_checklists to authenticated;
grant insert (checklist_id, workspace_id, position, body, quote, comment_id) on public.checklist_items to authenticated;
grant update (done_at, done_by) on public.checklist_items to authenticated;
grant all on public.revision_checklists, public.checklist_items to service_role;

-- The monthly cap is enforced here, whatever the UI does. Demo copies get a small fixed allowance.
create function private.enforce_ai_quota()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_plan public.plan_tier;
  v_demo boolean;
  v_used bigint;
  v_limit bigint;
begin
  if auth.uid() is not null and not private.is_team_member(new.workspace_id) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('ai:' || new.workspace_id::text, 0));
  select plan, is_demo into v_plan, v_demo from public.workspaces where id = new.workspace_id;
  v_limit := case when v_demo then 3 else private.plan_limit(v_plan, 'ai_per_month') end;
  select count(*) into v_used from public.revision_checklists
   where workspace_id = new.workspace_id and created_at >= date_trunc('month', now());
  if v_used >= v_limit then
    raise exception 'Your % plan has used its AI checklists for this month.', v_plan
      using errcode = 'P0001', hint = 'plan_limit:ai';
  end if;
  return new;
end;
$$;

create trigger revision_checklists_quota before insert on public.revision_checklists
  for each row execute function private.enforce_ai_quota();

-- ---------------------------------------------------------------------------
-- Notifications: one "seen up to" mark per person per studio. Unread is activity after it.
-- ---------------------------------------------------------------------------

create table public.notification_reads (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (user_id, workspace_id)
);

alter table public.notification_reads enable row level security;

create policy "Your own read marks" on public.notification_reads for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Mark your own as read" on public.notification_reads for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.workspace_role(workspace_id)) is not null);
create policy "Move your own mark" on public.notification_reads for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert (workspace_id, seen_at), update (seen_at) on public.notification_reads to authenticated;
grant all on public.notification_reads to service_role;

-- ---------------------------------------------------------------------------
-- Audit log: what platform admins did. Server-only (service role); never exposed to users.
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (char_length(action) <= 80),
  workspace_id uuid references public.workspaces (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);
alter table public.audit_log enable row level security;
grant all on public.audit_log to service_role;
