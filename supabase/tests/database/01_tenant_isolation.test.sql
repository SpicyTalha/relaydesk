-- Tenant isolation and role tests for Relaydesk.
-- Run with: supabase test db
--
-- Cast:
--   Workspace A "Atlas Studio": owner Olivia, member Marco, client Nadia (Northwind), client Priya (Pinecrest)
--   Workspace B "Brightside":   owner Ben, client Zoe (Zenith)
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(50);

-- ---------------------------------------------------------------------------
-- Fixtures (inserted as postgres, which bypasses RLS)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('00000000-0000-0000-0000-00000000000a', 'olivia@atlas.test', '{"full_name":"Olivia Owner"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'marco@atlas.test',  '{"full_name":"Marco Member"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'nadia@northwind.test', '{"full_name":"Nadia Client"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000d', 'priya@pinecrest.test', '{"full_name":"Priya Client"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000e', 'ben@brightside.test', '{"full_name":"Ben Owner"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000f', 'zoe@zenith.test', '{"full_name":"Zoe Client"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000010', 'newhire@atlas.test', '{"full_name":"New Hire"}', 'authenticated', 'authenticated');

insert into public.workspaces (id, name, slug, created_by) values
  ('a0000000-0000-0000-0000-000000000000', 'Atlas Studio', 'atlas-studio', '00000000-0000-0000-0000-00000000000a'),
  ('b0000000-0000-0000-0000-000000000000', 'Brightside', 'brightside', '00000000-0000-0000-0000-00000000000e');

insert into public.clients (id, workspace_id, name) values
  ('a1000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'Northwind Coffee'),
  ('a2000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'Pinecrest Dental'),
  ('b1000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'Zenith Bikes');

insert into public.memberships (workspace_id, user_id, role, client_id) values
  ('a0000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-00000000000b', 'member', null),
  ('a0000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-00000000000c', 'client', 'a1000000-0000-0000-0000-000000000000'),
  ('a0000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-00000000000d', 'client', 'a2000000-0000-0000-0000-000000000000'),
  ('b0000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-00000000000f', 'client', 'b1000000-0000-0000-0000-000000000000');

-- Northwind: one draft (d1) and one waiting for review (d2). Pinecrest: one in review (d3). Zenith: one in review (d4).
insert into public.deliverables (id, workspace_id, client_id, title, status, created_by) values
  ('d1000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000', 'Logo drafts', 'draft', '00000000-0000-0000-0000-00000000000b'),
  ('d2000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000', 'Menu board', 'draft', '00000000-0000-0000-0000-00000000000b'),
  ('d3000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000000', 'Clinic flyer', 'draft', '00000000-0000-0000-0000-00000000000b'),
  ('d4000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'Spring campaign', 'draft', '00000000-0000-0000-0000-00000000000e');

insert into public.deliverable_versions (id, deliverable_id, workspace_id, client_id, file_name, mime_type, size_bytes, storage_path, uploaded_by) values
  ('e2000000-0000-0000-0000-000000000000', 'd2000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000', 'menu.pdf', 'application/pdf', 1000,
   'a0000000-0000-0000-0000-000000000000/a1000000-0000-0000-0000-000000000000/d2000000-0000-0000-0000-000000000000/e2000000-0000-0000-0000-000000000000/menu.pdf', '00000000-0000-0000-0000-00000000000b'),
  ('e3000000-0000-0000-0000-000000000000', 'd3000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000000', 'flyer.pdf', 'application/pdf', 1000,
   'a0000000-0000-0000-0000-000000000000/a2000000-0000-0000-0000-000000000000/d3000000-0000-0000-0000-000000000000/e3000000-0000-0000-0000-000000000000/flyer.pdf', '00000000-0000-0000-0000-00000000000b'),
  ('e4000000-0000-0000-0000-000000000000', 'd4000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'spring.png', 'image/png', 1000,
   'b0000000-0000-0000-0000-000000000000/b1000000-0000-0000-0000-000000000000/d4000000-0000-0000-0000-000000000000/e4000000-0000-0000-0000-000000000000/spring.png', '00000000-0000-0000-0000-00000000000e');

update public.deliverables set status = 'in_review', approval_requested_at = now()
where id in ('d2000000-0000-0000-0000-000000000000', 'd3000000-0000-0000-0000-000000000000', 'd4000000-0000-0000-0000-000000000000');

insert into public.comments (deliverable_id, workspace_id, client_id, author_id, body) values
  ('d1000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-00000000000b', 'Internal: try a warmer brown'),
  ('d2000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-00000000000b', 'Here is the menu for review');

-- Pending invitations (tokens: 'tok-client', 'tok-member')
insert into public.invitations (workspace_id, email, role, client_id, token_hash, invited_by) values
  ('a0000000-0000-0000-0000-000000000000', 'newhire@atlas.test', 'member', null, encode(sha256('tok-member'::bytea), 'hex'), '00000000-0000-0000-0000-00000000000a');

-- ---------------------------------------------------------------------------
-- Fixture sanity
-- ---------------------------------------------------------------------------
select is((select count(*)::int from public.memberships where role = 'owner'), 2, 'workspace creation trigger made both owners');
select is((select count(*)::int from public.profiles), 7, 'every auth user got a profile');

-- ---------------------------------------------------------------------------
-- Anonymous visitors see nothing
-- ---------------------------------------------------------------------------
set local role anon;
select throws_ok('select count(*) from public.workspaces', '42501', null, 'anon cannot read workspaces');
select throws_ok('select count(*) from public.deliverables', '42501', null, 'anon cannot read deliverables');
select is((select count(*)::int from public.get_invitation('tok-member')), 1, 'anon can preview an invitation with its token');
select is((select count(*)::int from public.get_invitation('wrong-token')), 0, 'a wrong token reveals nothing');
reset role;

-- ---------------------------------------------------------------------------
-- Ben (owner of workspace B) cannot see anything in workspace A
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000e","email":"ben@brightside.test"}';
select is((select count(*)::int from public.workspaces), 1, 'Ben sees only his own workspace');
select is((select count(*)::int from public.clients where workspace_id = 'a0000000-0000-0000-0000-000000000000'), 0, 'Ben sees no clients of Atlas');
select is((select count(*)::int from public.deliverables where workspace_id = 'a0000000-0000-0000-0000-000000000000'), 0, 'Ben sees no deliverables of Atlas');
select is((select count(*)::int from public.comments where workspace_id = 'a0000000-0000-0000-0000-000000000000'), 0, 'Ben sees no comments of Atlas');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 0, 'Ben cannot read profiles of people he does not work with');
select throws_ok(
  $$insert into public.clients (workspace_id, name) values ('a0000000-0000-0000-0000-000000000000', 'Sneaky')$$,
  '42501', null, 'Ben cannot add a client to Atlas');
select is_empty(
  $$update public.deliverables set title = 'hacked' where id = 'd2000000-0000-0000-0000-000000000000' returning id$$,
  'Ben cannot rename an Atlas deliverable');
select throws_ok(
  $$select public.request_approval('d1000000-0000-0000-0000-000000000000')$$,
  'P0002', null, 'Ben cannot request approval on an Atlas deliverable');
reset role;

-- ---------------------------------------------------------------------------
-- Nadia (client of Northwind in workspace A)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000c","email":"nadia@northwind.test"}';
select is((select count(*)::int from public.clients), 1, 'Nadia sees only her own client space');
select is((select name from public.clients), 'Northwind Coffee', 'and it is Northwind');
select is((select count(*)::int from public.deliverables), 1, 'Nadia sees only shared work, not drafts or other clients');
select is((select id from public.deliverables), 'd2000000-0000-0000-0000-000000000000'::uuid, 'the visible deliverable is the one in review');
select is((select count(*)::int from public.deliverable_versions), 1, 'Nadia sees only versions of shared work');
select is((select count(*)::int from public.comments), 1, 'Nadia does not see internal comments on drafts');
select is((select count(*)::int from public.memberships where role = 'client'), 1, 'Nadia sees no other client users');
select is((select count(*)::int from public.memberships where role <> 'client'), 2, 'Nadia sees the agency team');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-00000000000d'), 0, 'Nadia cannot read the profile of a person at another client');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), 1, 'Nadia can read the profile of the agency team member');
select is((select count(*)::int from public.invitations), 0, 'clients see no invitations');
select throws_ok(
  $$insert into public.deliverables (workspace_id, client_id, title) values ('a0000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000', 'x')$$,
  '42501', null, 'clients cannot create deliverables');
select throws_ok(
  $$update public.deliverables set status = 'approved' where id = 'd2000000-0000-0000-0000-000000000000'$$,
  '42501', null, 'nobody can set status directly, not even through a column update');
select throws_ok(
  $$select public.submit_review('d3000000-0000-0000-0000-000000000000', 'approved')$$,
  'P0002', null, 'Nadia cannot review another client''s deliverable');
select throws_ok(
  $$select public.submit_review('d2000000-0000-0000-0000-000000000000', 'changes_requested', '   ')$$,
  'P0001', 'Tell the team what to change.', 'requesting changes needs a note');
select lives_ok(
  $$select public.submit_review('d2000000-0000-0000-0000-000000000000', 'changes_requested', 'Bigger prices please')$$,
  'Nadia can request changes on her deliverable');
select is((select status::text from public.deliverables where id = 'd2000000-0000-0000-0000-000000000000'), 'changes_requested', 'status follows the decision');
select throws_ok(
  $$select public.submit_review('d2000000-0000-0000-0000-000000000000', 'approved')$$,
  'P0001', null, 'she cannot decide twice without a new request');
select lives_ok(
  $$insert into public.comments (deliverable_id, workspace_id, client_id, body) values ('d2000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000', 'Thanks!')$$,
  'Nadia can comment on shared work');
select throws_ok(
  $$insert into public.comments (deliverable_id, workspace_id, client_id, body) values ('d1000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000', 'peek')$$,
  '42501', null, 'Nadia cannot comment on a draft she cannot see');
select ok(
  (select bool_and(client_visible and client_id = 'a1000000-0000-0000-0000-000000000000') from public.activity),
  'Nadia''s activity feed holds only client-visible events from her space');
reset role;

-- ---------------------------------------------------------------------------
-- Marco (team member of A)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000b","email":"marco@atlas.test"}';
select is((select count(*)::int from public.clients), 2, 'Marco sees every client of Atlas');
select is((select count(*)::int from public.deliverables), 3, 'Marco sees drafts too');
select throws_ok(
  $$select public.submit_review('d3000000-0000-0000-0000-000000000000', 'approved')$$,
  'P0002', null, 'the agency cannot approve its own work');
select throws_ok(
  $$insert into public.invitations (workspace_id, email, role, token_hash) values ('a0000000-0000-0000-0000-000000000000', 'friend@atlas.test', 'member', repeat('a', 64))$$,
  '42501', null, 'members cannot invite teammates');
select lives_ok(
  $$insert into public.invitations (workspace_id, email, role, client_id, token_hash) values ('a0000000-0000-0000-0000-000000000000', 'cto@northwind.test', 'client', 'a1000000-0000-0000-0000-000000000000', encode(sha256('tok-client'::bytea), 'hex'))$$,
  'members can invite clients');
select throws_ok(
  $$insert into public.clients (workspace_id, name) values ('a0000000-0000-0000-0000-000000000000', 'Third client')$$,
  'P0001', null, 'the free plan stops at 2 client spaces');
select lives_ok(
  $$select public.request_approval('d2000000-0000-0000-0000-000000000000', current_date + 3)$$,
  'Marco can ask for approval again after changes');
select throws_ok(
  $$select public.request_approval('d1000000-0000-0000-0000-000000000000')$$,
  'P0001', 'Upload a file before requesting approval.', 'approval needs at least one file');
reset role;

-- ---------------------------------------------------------------------------
-- Olivia (owner of A): the last owner cannot leave
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","email":"olivia@atlas.test"}';
select throws_ok(
  $$delete from public.memberships where user_id = '00000000-0000-0000-0000-00000000000a'$$,
  'P0001', 'A workspace needs at least one owner.', 'the last owner cannot leave');
select throws_ok(
  $$update public.workspaces set plan = 'studio' where id = 'a0000000-0000-0000-0000-000000000000'$$,
  '42501', null, 'owners cannot upgrade themselves without paying');
reset role;

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000e","email":"ben@brightside.test"}';
select throws_ok(
  $$select public.accept_invitation('tok-member')$$,
  'P0001', 'This invitation was sent to a different email address.', 'a forwarded invite link does not work for someone else');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000010","email":"newhire@atlas.test"}';
select throws_ok(
  $$select public.accept_invitation('tok-member')$$,
  'P0001', 'Your free plan includes 2 team seats. Upgrade to add more.', 'seat limits apply to invitations too');
reset role;

-- The Stripe webhook (service role) upgrades Atlas to Pro.
update public.workspaces set plan = 'pro' where id = 'a0000000-0000-0000-0000-000000000000';

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-000000000010","email":"newhire@atlas.test"}';
select is(public.accept_invitation('tok-member'), 'a0000000-0000-0000-0000-000000000000'::uuid, 'the invited person can accept');
select is((select count(*)::int from public.clients), 2, 'and now sees the workspace clients');
select throws_ok(
  $$select public.accept_invitation('tok-member')$$,
  'P0001', 'This invitation has already been used.', 'an invite link works only once');
reset role;

select * from finish();
rollback;
