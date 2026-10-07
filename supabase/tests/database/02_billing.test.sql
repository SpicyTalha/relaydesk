-- Billing guarantees: idempotent webhook application, server-only writes, owner-only reads.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(12);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@billing.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'member@billing.test', 'authenticated', 'authenticated');
insert into public.workspaces (id, name, slug, created_by) values
  ('a0000000-0000-0000-0000-0000000000b1', 'Billing Co', 'billing-co', '00000000-0000-0000-0000-0000000000a1');
insert into public.memberships (workspace_id, user_id, role) values
  ('a0000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a2', 'member');
insert into public.subscriptions (workspace_id, stripe_customer_id) values
  ('a0000000-0000-0000-0000-0000000000b1', 'cus_test_1');

-- The webhook (service role) applies a subscription event.
set local role service_role;
select is(
  public.apply_stripe_subscription('evt_1', 'customer.subscription.updated', now(), 'cus_test_1', 'sub_1', 'active', 'pro', false, 'relaydesk_pro_monthly', now() + interval '30 days'),
  'applied', 'a new event is applied');
select is((select plan::text from public.workspaces where id = 'a0000000-0000-0000-0000-0000000000b1'), 'pro', 'the workspace plan follows the subscription');

-- Stripe redelivers the same event: nothing changes, the delivery is counted.
select is(
  public.apply_stripe_subscription('evt_1', 'customer.subscription.updated', now(), 'cus_test_1', 'sub_1', 'canceled', 'free', false),
  'duplicate', 'a redelivered event is detected');
select is((select plan::text from public.workspaces where id = 'a0000000-0000-0000-0000-0000000000b1'), 'pro', 'and is not applied a second time');
select is((select deliveries from public.stripe_events where id = 'evt_1'), 2, 'the extra delivery is counted for the admin log');

select is(
  public.apply_stripe_subscription('evt_2', 'customer.subscription.updated', now(), 'cus_unknown', 'sub_x', 'active', 'studio', false),
  'unknown_customer', 'events for customers we did not create are ignored');
select is(public.flag_stripe_risk('evt_3', 'charge.dispute.created', now(), 'cus_test_1', 'Dispute opened'), 'recorded', 'disputes are recorded');
reset role;

-- Signed-in users can never write billing state.
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a1","email":"owner@billing.test"}';
select throws_ok(
  $$select public.apply_stripe_subscription('evt_9', 'x', now(), 'cus_test_1', 'sub_1', 'active', 'studio', false)$$,
  '42501', null, 'an owner cannot grant themselves a plan through the RPC');
select throws_ok($$select count(*) from public.stripe_events$$, '42501', null, 'the event log is not readable through the API');
select is((select plan::text from public.subscriptions), 'pro', 'the owner can read their own subscription');
select throws_ok($$select stripe_customer_id from public.subscriptions$$, '42501', null, 'but not the Stripe customer id column');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a2","email":"member@billing.test"}';
select is((select count(*)::int from public.subscriptions), 0, 'teammates cannot see billing');
reset role;

select * from finish();
rollback;
