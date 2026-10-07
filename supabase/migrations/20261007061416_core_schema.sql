-- Relaydesk core schema: tenants, roles, client spaces, deliverables, approvals.
--
-- Security model (see docs/BLUEPRINT.md, section 6):
--   * Every table has RLS on, and grants are explicit and least-privilege.
--     New Supabase tables are not exposed to the Data API by default, so nothing
--     here is reachable unless it is granted below.
--   * Membership checks live in the `private` schema, which the Data API does not
--     expose. Policies call them as `(select private.fn(...))` so Postgres caches
--     the result per statement instead of re-running it per row.
--   * State changes that need more than row ownership (accepting an invite,
--     requesting approval, approving) go through SECURITY DEFINER functions that
--     check `auth.uid()` themselves and are executable by `authenticated` only.

create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.member_role as enum ('owner', 'member', 'client');
create type public.plan_tier as enum ('free', 'pro', 'studio');
create type public.deliverable_status as enum ('draft', 'in_review', 'changes_requested', 'approved');
create type public.review_decision as enum ('approved', 'changes_requested');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$'),
  plan public.plan_tier not null default 'free',
  is_demo boolean not null default false,
  suspended_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  accent text not null default 'slate' check (accent in ('slate', 'blue', 'emerald', 'amber', 'rose', 'violet', 'cyan', 'orange')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Lets child tables prove their client belongs to the same workspace.
  unique (id, workspace_id)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  client_id uuid,
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id),
  foreign key (client_id, workspace_id) references public.clients (id, workspace_id) on delete cascade,
  -- A client membership always points at exactly one client space; team memberships never do.
  constraint client_role_has_client check ((role = 'client') = (client_id is not null))
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role public.member_role not null,
  client_id uuid,
  -- Only a SHA-256 of the token is stored. The token itself exists in the invite link only.
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  invited_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (client_id, workspace_id) references public.clients (id, workspace_id) on delete cascade,
  constraint invite_client_role_has_client check ((role = 'client') = (client_id is not null)),
  constraint invite_not_owner check (role <> 'owner')
);

create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  status public.deliverable_status not null default 'draft',
  due_on date,
  approval_requested_at timestamptz,
  decided_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (client_id, workspace_id) references public.clients (id, workspace_id) on delete cascade,
  unique (id, workspace_id, client_id)
);

create table public.deliverable_versions (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null,
  workspace_id uuid not null,
  client_id uuid not null,
  -- Assigned by the prepare_version trigger; the default only exists so clients never pass it.
  version integer not null default 0,
  file_name text not null check (char_length(file_name) between 1 and 180 and file_name !~ '[/\\]'),
  mime_type text not null check (char_length(mime_type) <= 120),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  storage_path text not null unique,
  note text not null default '' check (char_length(note) <= 1000),
  uploaded_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  foreign key (deliverable_id, workspace_id, client_id)
    references public.deliverables (id, workspace_id, client_id) on delete cascade,
  unique (deliverable_id, version)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables (id) on delete cascade,
  version_id uuid not null references public.deliverable_versions (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null,
  decision public.review_decision not null,
  note text not null default '' check (char_length(note) <= 2000),
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null,
  workspace_id uuid not null,
  client_id uuid not null,
  version_id uuid references public.deliverable_versions (id) on delete set null,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  foreign key (deliverable_id, workspace_id, client_id)
    references public.deliverables (id, workspace_id, client_id) on delete cascade
);

create table public.activity (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  deliverable_id uuid references public.deliverables (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  -- Drafts and team changes stay internal; clients only see what concerns them.
  client_visible boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (every column used by a policy or a hot query)
-- ---------------------------------------------------------------------------

create index memberships_user_idx on public.memberships (user_id);
create index memberships_client_idx on public.memberships (client_id) where client_id is not null;
create index clients_workspace_idx on public.clients (workspace_id);
create index invitations_workspace_idx on public.invitations (workspace_id) where accepted_at is null and revoked_at is null;
create index deliverables_client_idx on public.deliverables (workspace_id, client_id, status);
create index deliverables_due_idx on public.deliverables (workspace_id, due_on) where status = 'in_review';
create index versions_deliverable_idx on public.deliverable_versions (deliverable_id, version desc);
create index versions_workspace_idx on public.deliverable_versions (workspace_id);
create index reviews_deliverable_idx on public.reviews (deliverable_id, created_at desc);
create index comments_deliverable_idx on public.comments (deliverable_id, created_at);
create index activity_workspace_idx on public.activity (workspace_id, created_at desc);
create index activity_client_idx on public.activity (client_id, created_at desc) where client_visible;

-- ---------------------------------------------------------------------------
-- Private helpers used by policies
-- ---------------------------------------------------------------------------

create function private.workspace_role(ws uuid)
returns public.member_role
language sql stable security definer set search_path = ''
as $$
  select m.role from public.memberships m
  where m.workspace_id = ws and m.user_id = (select auth.uid());
$$;

create function private.is_team_member(ws uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.workspace_id = ws and m.user_id = (select auth.uid()) and m.role in ('owner', 'member')
  );
$$;

create function private.is_owner(ws uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.workspace_id = ws and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

-- True for the agency team, or for a client user of this exact client space.
create function private.can_access_client(ws uuid, cl uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.workspace_id = ws and m.user_id = (select auth.uid())
      and (m.role in ('owner', 'member') or m.client_id = cl)
  );
$$;

-- True when the signed-in user and `other` share at least one workspace.
create function private.shares_workspace(other uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = other
  );
$$;

create function private.plan_limit(p public.plan_tier, what text)
returns bigint
language sql immutable set search_path = ''
as $$
  select case what
    when 'clients' then case p when 'free' then 2 when 'pro' then 15 else null end
    when 'team' then case p when 'free' then 2 when 'pro' then 10 else null end
    when 'storage_bytes' then case p when 'free' then 262144000 when 'pro' then 21474836480 else 107374182400 end
  end;
$$;

revoke all on all functions in schema private from public;
grant execute on function
  private.workspace_role(uuid),
  private.is_team_member(uuid),
  private.is_owner(uuid),
  private.can_access_client(uuid, uuid),
  private.shares_workspace(uuid),
  private.plan_limit(public.plan_tier, text)
to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function private.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger workspaces_touch before update on public.workspaces
  for each row execute function private.touch_updated_at();
create trigger clients_touch before update on public.clients
  for each row execute function private.touch_updated_at();
create trigger deliverables_touch before update on public.deliverables
  for each row execute function private.touch_updated_at();

-- New auth user -> profile row. Name comes from sign-up metadata (display only).
create function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- New workspace -> its creator becomes the owner.
create function private.handle_new_workspace()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.memberships (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  insert into public.activity (workspace_id, actor_id, action)
  values (new.id, new.created_by, 'workspace.created');
  return new;
end;
$$;

create trigger on_workspace_created after insert on public.workspaces
  for each row execute function private.handle_new_workspace();

-- A workspace must always keep at least one owner.
create function private.guard_last_owner()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.role = 'owner'
     and (tg_op = 'DELETE' or new.role <> 'owner')
     and not exists (
       select 1 from public.memberships m
       where m.workspace_id = old.workspace_id and m.role = 'owner' and m.id <> old.id
     )
     -- Deleting the whole workspace cascades here; let that through.
     and exists (select 1 from public.workspaces w where w.id = old.workspace_id)
  then
    raise exception 'A workspace needs at least one owner.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger memberships_guard_owner before update or delete on public.memberships
  for each row execute function private.guard_last_owner();

-- Plan limits are enforced in the database, so no client can skip them.
create function private.enforce_client_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_plan public.plan_tier;
  v_limit bigint;
begin
  -- Outsiders get RLS's plain "permission denied", never details about someone else's plan.
  if auth.uid() is not null and not private.is_team_member(new.workspace_id) then
    return new;
  end if;
  select plan into v_plan from public.workspaces where id = new.workspace_id;
  v_limit := private.plan_limit(v_plan, 'clients');
  if v_limit is not null and (
    select count(*) from public.clients c
    where c.workspace_id = new.workspace_id and c.archived_at is null
  ) >= v_limit then
    raise exception 'Your % plan includes % client spaces. Upgrade to add more.', v_plan, v_limit
      using errcode = 'P0001', hint = 'plan_limit:clients';
  end if;
  return new;
end;
$$;

create trigger clients_enforce_limit before insert on public.clients
  for each row execute function private.enforce_client_limit();

create function private.enforce_team_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_plan public.plan_tier;
  v_limit bigint;
begin
  if new.role = 'client' then
    return new;
  end if;
  select plan into v_plan from public.workspaces where id = new.workspace_id;
  v_limit := private.plan_limit(v_plan, 'team');
  if v_limit is not null and (
    select count(*) from public.memberships m
    where m.workspace_id = new.workspace_id and m.role in ('owner', 'member')
  ) >= v_limit then
    raise exception 'Your % plan includes % team seats. Upgrade to add more.', v_plan, v_limit
      using errcode = 'P0001', hint = 'plan_limit:team';
  end if;
  return new;
end;
$$;

create trigger memberships_enforce_limit before insert on public.memberships
  for each row execute function private.enforce_team_limit();

-- New version: assign the next number, verify the storage path, check storage quota,
-- and reopen a decided deliverable (a new file needs a new decision).
create function private.prepare_version()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_plan public.plan_tier;
  v_used bigint;
begin
  -- Outsiders get RLS's plain "permission denied", never details about someone else's plan.
  if auth.uid() is not null and not private.is_team_member(new.workspace_id) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.deliverable_id::text, 0));

  select coalesce(max(version), 0) + 1 into new.version
  from public.deliverable_versions where deliverable_id = new.deliverable_id;

  if new.storage_path <> format('%s/%s/%s/%s/%s', new.workspace_id, new.client_id, new.deliverable_id, new.id, new.file_name) then
    raise exception 'Storage path does not match the deliverable.' using errcode = 'P0001';
  end if;

  select plan into v_plan from public.workspaces where id = new.workspace_id;
  select coalesce(sum(size_bytes), 0) into v_used from public.deliverable_versions where workspace_id = new.workspace_id;
  if v_used + new.size_bytes > private.plan_limit(v_plan, 'storage_bytes') then
    raise exception 'This upload would go over your % plan storage.', v_plan
      using errcode = 'P0001', hint = 'plan_limit:storage';
  end if;

  update public.deliverables
     set status = case when status in ('approved', 'changes_requested') then 'draft'::public.deliverable_status else status end,
         decided_at = case when status in ('approved', 'changes_requested') then null else decided_at end
   where id = new.deliverable_id;

  return new;
end;
$$;

create trigger versions_prepare before insert on public.deliverable_versions
  for each row execute function private.prepare_version();

-- Activity log entries written by triggers (users can't insert into it directly).
create function private.log_activity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_status public.deliverable_status;
begin
  if tg_table_name = 'clients' then
    insert into public.activity (workspace_id, client_id, actor_id, action, metadata)
    values (new.workspace_id, new.id, auth.uid(), 'client.created', jsonb_build_object('name', new.name));

  elsif tg_table_name = 'deliverables' then
    insert into public.activity (workspace_id, client_id, deliverable_id, actor_id, action, metadata)
    values (new.workspace_id, new.client_id, new.id, auth.uid(), 'deliverable.created', jsonb_build_object('title', new.title));

  elsif tg_table_name = 'deliverable_versions' then
    select status into v_status from public.deliverables where id = new.deliverable_id;
    insert into public.activity (workspace_id, client_id, deliverable_id, actor_id, action, client_visible, metadata)
    values (new.workspace_id, new.client_id, new.deliverable_id, new.uploaded_by, 'version.uploaded',
            v_status <> 'draft', jsonb_build_object('version', new.version, 'file_name', new.file_name));

  elsif tg_table_name = 'comments' then
    insert into public.activity (workspace_id, client_id, deliverable_id, actor_id, action, client_visible, metadata)
    values (new.workspace_id, new.client_id, new.deliverable_id, new.author_id, 'comment.created', true,
            jsonb_build_object('comment_id', new.id));

  elsif tg_table_name = 'memberships' and new.role <> 'owner' then
    insert into public.activity (workspace_id, client_id, actor_id, action, client_visible, metadata)
    values (new.workspace_id, new.client_id, new.user_id, 'member.joined', new.role = 'client',
            jsonb_build_object('role', new.role));
  end if;
  return new;
end;
$$;

create trigger clients_log after insert on public.clients
  for each row execute function private.log_activity();
create trigger deliverables_log after insert on public.deliverables
  for each row execute function private.log_activity();
create trigger versions_log after insert on public.deliverable_versions
  for each row execute function private.log_activity();
create trigger comments_log after insert on public.comments
  for each row execute function private.log_activity();
create trigger memberships_log after insert on public.memberships
  for each row execute function private.log_activity();

-- ---------------------------------------------------------------------------
-- RPC: state changes with their own authorization checks
-- ---------------------------------------------------------------------------

-- Preview an invitation before signing in. The token is the secret, so anon may call this,
-- and it returns only what the invite page needs to show.
create function public.get_invitation(p_token text)
returns table (workspace_name text, client_name text, role public.member_role, email text, inviter_name text, expired boolean)
language sql stable security definer set search_path = ''
as $$
  select w.name, c.name, i.role, i.email, coalesce(nullif(p.full_name, ''), 'A teammate'),
         i.expires_at < now()
  from public.invitations i
  join public.workspaces w on w.id = i.workspace_id
  left join public.clients c on c.id = i.client_id
  left join public.profiles p on p.id = i.invited_by
  where i.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and i.accepted_at is null and i.revoked_at is null;
$$;

create function public.accept_invitation(p_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_inv public.invitations;
begin
  if v_uid is null then
    raise exception 'Sign in to accept this invitation.' using errcode = '28000';
  end if;

  select * into v_inv from public.invitations
  where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
  for update;

  if not found or v_inv.revoked_at is not null then
    raise exception 'This invitation is not valid.' using errcode = 'P0001';
  elsif v_inv.accepted_at is not null then
    raise exception 'This invitation has already been used.' using errcode = 'P0001';
  elsif v_inv.expires_at < now() then
    raise exception 'This invitation has expired. Ask for a new one.' using errcode = 'P0001';
  elsif v_inv.email <> v_email then
    raise exception 'This invitation was sent to a different email address.' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.memberships where workspace_id = v_inv.workspace_id and user_id = v_uid) then
    raise exception 'You are already in this workspace.' using errcode = 'P0001';
  end if;

  insert into public.memberships (workspace_id, user_id, role, client_id)
  values (v_inv.workspace_id, v_uid, v_inv.role, v_inv.client_id);

  update public.invitations set accepted_at = now(), accepted_by = v_uid where id = v_inv.id;

  return v_inv.workspace_id;
end;
$$;

create function public.request_approval(p_deliverable uuid, p_due_on date default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_d public.deliverables;
begin
  select * into v_d from public.deliverables where id = p_deliverable for update;
  if not found or not private.is_team_member(v_d.workspace_id) then
    raise exception 'Deliverable not found.' using errcode = 'P0002';
  end if;
  if v_d.status not in ('draft', 'changes_requested') then
    raise exception 'Approval is already requested or decided.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.deliverable_versions where deliverable_id = p_deliverable) then
    raise exception 'Upload a file before requesting approval.' using errcode = 'P0001';
  end if;

  update public.deliverables
     set status = 'in_review', approval_requested_at = now(), decided_at = null,
         due_on = coalesce(p_due_on, due_on)
   where id = p_deliverable;

  insert into public.activity (workspace_id, client_id, deliverable_id, actor_id, action, client_visible, metadata)
  values (v_d.workspace_id, v_d.client_id, v_d.id, auth.uid(), 'approval.requested', true,
          jsonb_build_object('title', v_d.title, 'due_on', coalesce(p_due_on, v_d.due_on)));
end;
$$;

create function public.submit_review(p_deliverable uuid, p_decision public.review_decision, p_note text default '')
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_d public.deliverables;
  v_version uuid;
begin
  select * into v_d from public.deliverables where id = p_deliverable for update;
  -- Only a client user of this client space can decide; the agency can't approve its own work.
  if not found or not exists (
    select 1 from public.memberships m
    where m.workspace_id = v_d.workspace_id and m.user_id = auth.uid()
      and m.role = 'client' and m.client_id = v_d.client_id
  ) then
    raise exception 'Deliverable not found.' using errcode = 'P0002';
  end if;
  if v_d.status <> 'in_review' then
    raise exception 'This deliverable is not waiting for your review.' using errcode = 'P0001';
  end if;
  if p_decision = 'changes_requested' and char_length(btrim(coalesce(p_note, ''))) = 0 then
    raise exception 'Tell the team what to change.' using errcode = 'P0001';
  end if;

  select id into v_version from public.deliverable_versions
  where deliverable_id = p_deliverable order by version desc limit 1;

  insert into public.reviews (deliverable_id, version_id, workspace_id, client_id, decision, note, reviewer_id)
  values (v_d.id, v_version, v_d.workspace_id, v_d.client_id, p_decision, btrim(coalesce(p_note, '')), auth.uid());

  update public.deliverables
     set status = p_decision::text::public.deliverable_status, decided_at = now()
   where id = v_d.id;

  insert into public.activity (workspace_id, client_id, deliverable_id, actor_id, action, client_visible, metadata)
  values (v_d.workspace_id, v_d.client_id, v_d.id, auth.uid(),
          case p_decision when 'approved' then 'deliverable.approved' else 'changes.requested' end, true,
          jsonb_build_object('title', v_d.title, 'note', left(btrim(coalesce(p_note, '')), 280)));
end;
$$;

revoke all on function public.get_invitation(text) from public;
revoke all on function public.accept_invitation(text) from public;
revoke all on function public.request_approval(uuid, date) from public;
revoke all on function public.submit_review(uuid, public.review_decision, text) from public;
grant execute on function public.get_invitation(text) to anon, authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.request_approval(uuid, date) to authenticated;
grant execute on function public.submit_review(uuid, public.review_decision, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.clients enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.deliverables enable row level security;
alter table public.deliverable_versions enable row level security;
alter table public.reviews enable row level security;
alter table public.comments enable row level security;
alter table public.activity enable row level security;

-- profiles
create policy "See yourself and people you work with" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.shares_workspace(id)));
create policy "Edit your own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- workspaces
create policy "Members see their workspaces" on public.workspaces for select to authenticated
  using ((select private.workspace_role(id)) is not null);
create policy "Anyone signed in can start a workspace" on public.workspaces for insert to authenticated
  with check (created_by = (select auth.uid()) and plan = 'free' and not is_demo and suspended_at is null);
create policy "Owners rename their workspace" on public.workspaces for update to authenticated
  using ((select private.is_owner(id))) with check ((select private.is_owner(id)));
create policy "Owners delete their workspace" on public.workspaces for delete to authenticated
  using ((select private.is_owner(id)) and not is_demo);

-- clients
create policy "Team sees all clients, clients see their own space" on public.clients for select to authenticated
  using ((select private.can_access_client(workspace_id, id)));
create policy "Team adds clients" on public.clients for insert to authenticated
  with check ((select private.is_team_member(workspace_id)));
create policy "Team edits clients" on public.clients for update to authenticated
  using ((select private.is_team_member(workspace_id))) with check ((select private.is_team_member(workspace_id)));
create policy "Owners delete clients" on public.clients for delete to authenticated
  using ((select private.is_owner(workspace_id)));

-- memberships
create policy "Team sees everyone, clients see the team and themselves" on public.memberships for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_team_member(workspace_id))
    or (role <> 'client' and (select private.workspace_role(workspace_id)) is not null)
  );
create policy "Owners change roles" on public.memberships for update to authenticated
  using ((select private.is_owner(workspace_id)) and role <> 'client')
  with check ((select private.is_owner(workspace_id)) and role <> 'client');
create policy "Owners remove people, anyone can leave" on public.memberships for delete to authenticated
  using ((select private.is_owner(workspace_id)) or user_id = (select auth.uid()));

-- invitations: owners invite teammates, the whole team invites clients
create policy "Team sees pending invites" on public.invitations for select to authenticated
  using ((select private.is_team_member(workspace_id)));
create policy "Owners invite the team, the team invites clients" on public.invitations for insert to authenticated
  with check (
    invited_by = (select auth.uid())
    and accepted_at is null and revoked_at is null
    and ((select private.is_owner(workspace_id)) or (role = 'client' and (select private.is_team_member(workspace_id))))
  );
create policy "Team revokes invites" on public.invitations for update to authenticated
  using ((select private.is_team_member(workspace_id))) with check ((select private.is_team_member(workspace_id)));

-- deliverables: clients never see drafts
create policy "Team sees all, clients see shared work" on public.deliverables for select to authenticated
  using (
    (select private.is_team_member(workspace_id))
    or (status <> 'draft' and (select private.can_access_client(workspace_id, client_id)))
  );
create policy "Team creates deliverables" on public.deliverables for insert to authenticated
  with check ((select private.is_team_member(workspace_id)) and status = 'draft' and created_by = (select auth.uid()));
create policy "Team edits deliverables" on public.deliverables for update to authenticated
  using ((select private.is_team_member(workspace_id))) with check ((select private.is_team_member(workspace_id)));
create policy "Team deletes deliverables" on public.deliverables for delete to authenticated
  using ((select private.is_team_member(workspace_id)));

-- versions
create policy "Visible with their deliverable" on public.deliverable_versions for select to authenticated
  using (
    (select private.is_team_member(workspace_id))
    or (
      (select private.can_access_client(workspace_id, client_id))
      and exists (select 1 from public.deliverables d where d.id = deliverable_id and d.status <> 'draft')
    )
  );
create policy "Team uploads versions" on public.deliverable_versions for insert to authenticated
  with check ((select private.is_team_member(workspace_id)) and uploaded_by = (select auth.uid()));

-- reviews: written only through submit_review()
create policy "Visible to the client space" on public.reviews for select to authenticated
  using ((select private.can_access_client(workspace_id, client_id)));

-- comments
create policy "Visible with their deliverable" on public.comments for select to authenticated
  using (
    (select private.is_team_member(workspace_id))
    or (
      (select private.can_access_client(workspace_id, client_id))
      and exists (select 1 from public.deliverables d where d.id = deliverable_id and d.status <> 'draft')
    )
  );
create policy "Comment where you can see the work" on public.comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and deleted_at is null and edited_at is null
    and (
      (select private.is_team_member(workspace_id))
      or (
        (select private.can_access_client(workspace_id, client_id))
        and exists (select 1 from public.deliverables d where d.id = deliverable_id and d.status <> 'draft')
      )
    )
  );
create policy "Edit or delete your own comments" on public.comments for update to authenticated
  using (author_id = (select auth.uid()) and deleted_at is null)
  with check (author_id = (select auth.uid()));

-- activity: written only by triggers and RPCs
create policy "Team sees everything, clients see their space" on public.activity for select to authenticated
  using (
    (select private.is_team_member(workspace_id))
    or (client_visible and client_id is not null and (select private.can_access_client(workspace_id, client_id)))
  );

-- ---------------------------------------------------------------------------
-- Grants: only what the policies above need. `anon` gets no table access at all.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

grant select on public.workspaces to authenticated;
grant insert (name, slug) on public.workspaces to authenticated;
grant update (name) on public.workspaces to authenticated;
grant delete on public.workspaces to authenticated;

grant select on public.clients to authenticated;
grant insert (workspace_id, name, accent) on public.clients to authenticated;
grant update (name, accent, archived_at) on public.clients to authenticated;
grant delete on public.clients to authenticated;

grant select on public.memberships to authenticated;
grant update (role) on public.memberships to authenticated;
grant delete on public.memberships to authenticated;

grant select (id, workspace_id, email, role, client_id, invited_by, expires_at, accepted_at, revoked_at, created_at)
  on public.invitations to authenticated;
grant insert (workspace_id, email, role, client_id, token_hash) on public.invitations to authenticated;
grant update (revoked_at) on public.invitations to authenticated;

grant select on public.deliverables to authenticated;
grant insert (workspace_id, client_id, title, description, due_on) on public.deliverables to authenticated;
grant update (title, description, due_on) on public.deliverables to authenticated;
grant delete on public.deliverables to authenticated;

grant select on public.deliverable_versions to authenticated;
grant insert (id, deliverable_id, workspace_id, client_id, file_name, mime_type, size_bytes, storage_path, note)
  on public.deliverable_versions to authenticated;

grant select on public.reviews to authenticated;

grant select on public.comments to authenticated;
grant insert (deliverable_id, workspace_id, client_id, version_id, body) on public.comments to authenticated;
grant update (body, edited_at, deleted_at) on public.comments to authenticated;

grant select on public.activity to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: one private bucket, paths carry the tenant
--   {workspace_id}/{client_id}/{deliverable_id}/{version_id}/{file_name}
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('deliverables', 'deliverables', false, 52428800)
on conflict (id) do nothing;

create policy "Read files in client spaces you can access" on storage.objects for select to authenticated
  using (
    bucket_id = 'deliverables'
    and exists (
      select 1 from public.deliverable_versions v
      where v.storage_path = name
        and (
          (select private.is_team_member(v.workspace_id))
          or (
            (select private.can_access_client(v.workspace_id, v.client_id))
            and exists (select 1 from public.deliverables d where d.id = v.deliverable_id and d.status <> 'draft')
          )
        )
    )
  );

create policy "Team uploads into its own workspace" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'deliverables'
    and (select private.is_team_member(((storage.foldername(name))[1])::uuid))
    and exists (
      select 1 from public.deliverables d
      where d.id = ((storage.foldername(name))[3])::uuid
        and d.workspace_id = ((storage.foldername(name))[1])::uuid
        and d.client_id = ((storage.foldername(name))[2])::uuid
    )
  );

-- The server (webhook, demo reset, admin panel) uses service_role. It bypasses RLS,
-- but under Supabase's new default it still needs explicit table grants.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Future tables and functions start closed: each migration must grant what it needs.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
