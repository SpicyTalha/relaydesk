-- Pins, resolving feedback, AI checklists, notification marks and the audit log.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(20);

-- A studio (owner, member, one client user) and an outsider with their own studio.
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000c1', 'owner@pins.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c2', 'member@pins.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c3', 'client@pins.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c4', 'outsider@pins.test', 'authenticated', 'authenticated');
insert into public.workspaces (id, name, slug, plan, created_by) values
  ('c0000000-0000-0000-0000-0000000000a1', 'Pin Studio', 'pin-studio', 'pro', '00000000-0000-0000-0000-0000000000c1'),
  ('c0000000-0000-0000-0000-0000000000a2', 'Elsewhere', 'elsewhere', 'pro', '00000000-0000-0000-0000-0000000000c4');
insert into public.clients (id, workspace_id, name) values
  ('c0000000-0000-0000-0000-0000000000b1', 'c0000000-0000-0000-0000-0000000000a1', 'Harbor Bakery');
insert into public.memberships (workspace_id, user_id, role, client_id) values
  ('c0000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c2', 'member', null),
  ('c0000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c3', 'client', 'c0000000-0000-0000-0000-0000000000b1');
insert into public.deliverables (id, workspace_id, client_id, title, status, created_by) values
  ('c0000000-0000-0000-0000-0000000000d1', 'c0000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-0000000000b1', 'Bread label', 'in_review', '00000000-0000-0000-0000-0000000000c2');
insert into public.deliverable_versions (id, deliverable_id, workspace_id, client_id, file_name, mime_type, size_bytes, storage_path, uploaded_by) values
  ('c0000000-0000-0000-0000-0000000000e1', 'c0000000-0000-0000-0000-0000000000d1', 'c0000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-0000000000b1',
   'label.png', 'image/png', 1000,
   'c0000000-0000-0000-0000-0000000000a1/c0000000-0000-0000-0000-0000000000b1/c0000000-0000-0000-0000-0000000000d1/c0000000-0000-0000-0000-0000000000e1/label.png',
   '00000000-0000-0000-0000-0000000000c2');

-- ---- Pins -------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c3"}';
select lives_ok($$
  insert into public.comments (deliverable_id, workspace_id, client_id, version_id, body, pin_x, pin_y)
  values ('c0000000-0000-0000-0000-0000000000d1', 'c0000000-0000-0000-0000-0000000000a1',
          'c0000000-0000-0000-0000-0000000000b1', 'c0000000-0000-0000-0000-0000000000e1', 'Logo bigger here', 0.25, 0.4)
$$, 'a client can pin a note to a spot on the work');
select throws_ok($$
  insert into public.comments (deliverable_id, workspace_id, client_id, body, pin_x, pin_y)
  values ('c0000000-0000-0000-0000-0000000000d1', 'c0000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-0000000000b1', 'Floating pin', 0.5, 0.5)
$$, '23514', null, 'a pin always belongs to a version');
select throws_ok($$
  insert into public.comments (deliverable_id, workspace_id, client_id, version_id, body, pin_x, pin_y)
  values ('c0000000-0000-0000-0000-0000000000d1', 'c0000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-0000000000b1',
          'c0000000-0000-0000-0000-0000000000e1', 'Off the page', 1.5, 0.5)
$$, '23514', null, 'a pin has to land on the work');

-- ---- Resolving feedback -------------------------------------------------------
select throws_ok($$select public.set_comment_resolved((select id from public.comments where body = 'Logo bigger here'), true)$$,
  '42501', null, 'a client cannot mark feedback as resolved');
select throws_ok($$update public.comments set resolved_at = now() where id = (select id from public.comments where body = 'Logo bigger here')$$,
  '42501', null, 'nor set the column directly');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c4"}';
select throws_ok($$select public.set_comment_resolved((select id from public.comments where body = 'Logo bigger here'), true)$$,
  '42501', null, 'another studio cannot touch it');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c2"}';
select lives_ok($$select public.set_comment_resolved((select id from public.comments where body = 'Logo bigger here'), true)$$, 'the team resolves feedback');
select isnt((select resolved_at from public.comments where id = (select id from public.comments where body = 'Logo bigger here')), null, 'and it is marked resolved');

-- ---- AI checklists ------------------------------------------------------------
select lives_ok($$
  insert into public.revision_checklists (workspace_id, client_id, deliverable_id, version_id, model)
  values ('c0000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-0000000000b1',
          'c0000000-0000-0000-0000-0000000000d1', 'c0000000-0000-0000-0000-0000000000e1', 'test-model')
$$, 'a teammate on Pro makes a checklist');
select lives_ok($$
  insert into public.checklist_items (checklist_id, workspace_id, position, body, quote, comment_id)
  values ((select id from public.revision_checklists where model = 'test-model'), 'c0000000-0000-0000-0000-0000000000a1', 0,
          'Make the logo bigger', 'Logo bigger here', (select id from public.comments where body = 'Logo bigger here'))
$$, 'with items that quote the feedback');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c3"}';
select is((select count(*)::int from public.revision_checklists), 0, 'clients never see the internal checklist');
select throws_ok($$
  insert into public.revision_checklists (workspace_id, client_id, deliverable_id, model)
  values ('c0000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-0000000000b1', 'c0000000-0000-0000-0000-0000000000d1', 'x')
$$, '42501', null, 'and cannot make one');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c4"}';
select is((select count(*)::int from public.checklist_items), 0, 'another studio cannot read the items');
reset role;

-- The monthly cap holds in the database: Free has no AI checklists.
update public.workspaces set plan = 'free' where id = 'c0000000-0000-0000-0000-0000000000a1';
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c2"}';
select throws_ok($$
  insert into public.revision_checklists (workspace_id, client_id, deliverable_id, model)
  values ('c0000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-0000000000b1', 'c0000000-0000-0000-0000-0000000000d1', 'x')
$$, 'P0001', null, 'a studio over its AI allowance is stopped');

-- ---- Notification marks -------------------------------------------------------
select lives_ok($$insert into public.notification_reads (workspace_id) values ('c0000000-0000-0000-0000-0000000000a1')$$,
  'people mark their own notifications as seen');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c4"}';
select throws_ok($$insert into public.notification_reads (workspace_id) values ('c0000000-0000-0000-0000-0000000000a1')$$,
  '42501', null, 'but only in studios they belong to');
select is((select count(*)::int from public.notification_reads), 0, 'and nobody reads anyone else''s marks');

reset role;

-- ---- Suspension ---------------------------------------------------------------
update public.workspaces set suspended_at = now() where id = 'c0000000-0000-0000-0000-0000000000a1';
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c3"}';
select throws_ok($$
  insert into public.comments (deliverable_id, workspace_id, client_id, body)
  values ('c0000000-0000-0000-0000-0000000000d1', 'c0000000-0000-0000-0000-0000000000a1', 'c0000000-0000-0000-0000-0000000000b1', 'Still there?')
$$, 'P0001', null, 'a suspended studio takes no new writes');
select is((select count(*)::int from public.deliverables), 1, 'but its work stays readable');
reset role;

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c4"}';

-- ---- Audit log ----------------------------------------------------------------
select throws_ok($$select count(*) from public.audit_log$$, '42501', null, 'the admin audit log is not reachable through the API');
reset role;

select * from finish();
rollback;
