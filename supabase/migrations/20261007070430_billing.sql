-- Billing: Stripe is the source of truth, the webhook is the only writer.
--
-- * subscriptions maps a workspace to its Stripe customer and subscription.
-- * stripe_events records every event id we receive. apply_stripe_subscription() inserts the
--   event id and applies the plan change in ONE transaction, so a redelivered event can never
--   be applied twice, and a crash between the two can't leave them out of sync.
-- * Neither table is readable by clients through the API except owners reading their own row.

create table public.subscriptions (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  status text not null default 'none',
  plan public.plan_tier not null default 'free',
  price_lookup_key text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  risk_note text,
  updated_at timestamptz not null default now()
);

create table public.stripe_events (
  id text primary key,                     -- Stripe's evt_ id: the idempotency key
  type text not null,
  stripe_created_at timestamptz not null,
  received_at timestamptz not null default now(),
  deliveries integer not null default 1,   -- > 1 means Stripe retried or replayed it
  outcome text not null check (outcome in ('applied', 'recorded', 'ignored')),
  workspace_id uuid references public.workspaces (id) on delete set null,
  summary text not null default ''
);

create index stripe_events_received_idx on public.stripe_events (received_at desc);

alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;

create policy "Owners see their subscription" on public.subscriptions for select to authenticated
  using ((select private.is_owner(workspace_id)));

grant select (workspace_id, status, plan, current_period_end, cancel_at_period_end, updated_at)
  on public.subscriptions to authenticated;
-- stripe_events: service role only (admin panel). No grants to authenticated or anon.
grant all on public.subscriptions, public.stripe_events to service_role;

-- Record an event exactly once. Returns false when it was already seen (a duplicate delivery).
create function public.record_stripe_event(
  p_event_id text, p_type text, p_created timestamptz, p_outcome text, p_summary text default '', p_workspace uuid default null
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_inserted boolean;
begin
  insert into public.stripe_events (id, type, stripe_created_at, outcome, workspace_id, summary)
  values (p_event_id, p_type, p_created, p_outcome, p_workspace, p_summary)
  on conflict (id) do update set deliveries = public.stripe_events.deliveries + 1
  returning (xmax = 0) into v_inserted;
  return v_inserted;
end;
$$;

-- Apply the current state of a subscription (re-fetched from Stripe by the webhook),
-- deduplicated on the event id, in a single transaction.
create function public.apply_stripe_subscription(
  p_event_id text,
  p_event_type text,
  p_event_created timestamptz,
  p_customer text,
  p_subscription text,
  p_status text,
  p_plan public.plan_tier,
  p_cancel_at_period_end boolean,
  p_lookup_key text default null,
  p_period_end timestamptz default null
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_workspace uuid;
  v_new boolean;
begin
  select workspace_id into v_workspace from public.subscriptions where stripe_customer_id = p_customer for update;
  if v_workspace is null then
    perform public.record_stripe_event(p_event_id, p_event_type, p_event_created, 'ignored', 'Unknown customer ' || p_customer);
    return 'unknown_customer';
  end if;

  v_new := public.record_stripe_event(p_event_id, p_event_type, p_event_created, 'applied',
             format('%s: %s on %s', p_subscription, p_status, p_plan), v_workspace);
  if not v_new then
    return 'duplicate';
  end if;

  update public.subscriptions
     set stripe_subscription_id = p_subscription,
         status = p_status,
         plan = p_plan,
         price_lookup_key = p_lookup_key,
         current_period_end = p_period_end,
         cancel_at_period_end = p_cancel_at_period_end,
         updated_at = now()
   where workspace_id = v_workspace;

  update public.workspaces set plan = p_plan where id = v_workspace;
  return 'applied';
end;
$$;

-- Disputes, refunds and fraud warnings: recorded and flagged on the subscription for follow-up.
create function public.flag_stripe_risk(
  p_event_id text, p_event_type text, p_event_created timestamptz, p_customer text, p_note text
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_workspace uuid;
begin
  select workspace_id into v_workspace from public.subscriptions where stripe_customer_id = p_customer;
  if not public.record_stripe_event(p_event_id, p_event_type, p_event_created, 'recorded', p_note, v_workspace) then
    return 'duplicate';
  end if;
  if v_workspace is not null then
    update public.subscriptions set risk_note = p_note, updated_at = now() where workspace_id = v_workspace;
  end if;
  return 'recorded';
end;
$$;

revoke all on function public.record_stripe_event(text, text, timestamptz, text, text, uuid) from public, anon, authenticated;
revoke all on function public.apply_stripe_subscription(text, text, timestamptz, text, text, text, public.plan_tier, boolean, text, timestamptz) from public, anon, authenticated;
revoke all on function public.flag_stripe_risk(text, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.record_stripe_event(text, text, timestamptz, text, text, uuid) to service_role;
grant execute on function public.apply_stripe_subscription(text, text, timestamptz, text, text, text, public.plan_tier, boolean, text, timestamptz) to service_role;
grant execute on function public.flag_stripe_risk(text, text, timestamptz, text, text) to service_role;
