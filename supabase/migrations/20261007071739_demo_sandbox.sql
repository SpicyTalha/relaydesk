-- Demo sandboxes: every visitor who clicks "Try the demo" gets a private copy of a seeded agency.
-- See docs/BLUEPRINT.md, decision 5. Only the server (service role) can create or list them.

create table public.demo_sandboxes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  ip_hash text not null,
  user_ids uuid[] not null,
  created_at timestamptz not null default now()
);
create index demo_sandboxes_ip_idx on public.demo_sandboxes (ip_hash, created_at desc);
create index demo_sandboxes_created_idx on public.demo_sandboxes (created_at);
alter table public.demo_sandboxes enable row level security;
grant all on public.demo_sandboxes to service_role;

-- Adds one version from a template file and returns the storage copy the caller must perform.
create function private.demo_version(
  p_ws uuid, p_client uuid, p_deliverable uuid, p_template text, p_mime text, p_sizes jsonb,
  p_uploader uuid, p_at timestamptz, p_note text default ''
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_path text := format('%s/%s/%s/%s/%s', p_ws, p_client, p_deliverable, v_id, p_template);
begin
  insert into public.deliverable_versions (id, deliverable_id, workspace_id, client_id, file_name, mime_type, size_bytes, storage_path, note, uploaded_by, created_at)
  values (v_id, p_deliverable, p_ws, p_client, p_template, p_mime, (p_sizes ->> p_template)::bigint, v_path, p_note, p_uploader, p_at);
  return jsonb_build_object('template', p_template, 'path', v_path, 'version_id', v_id);
end;
$$;

create function public.create_demo_workspace(
  p_owner uuid, p_member uuid, p_client_a uuid, p_client_b uuid, p_sizes jsonb, p_ip_hash text
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  n timestamptz := now();
  ws uuid := gen_random_uuid();
  slug text := 'kestrel-demo-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  c_nw uuid := gen_random_uuid();   -- Northwind Coffee
  c_pc uuid := gen_random_uuid();   -- Pinecrest Dental
  c_jy uuid := gen_random_uuid();   -- Juniper Yoga
  d_menu uuid := gen_random_uuid();
  d_insta uuid := gen_random_uuid();
  d_card uuid := gen_random_uuid();
  d_guide uuid := gen_random_uuid();
  d_home uuid := gen_random_uuid();
  d_poster uuid := gen_random_uuid();
  d_logo uuid := gen_random_uuid();
  d_sched uuid := gen_random_uuid();
  copies jsonb := '[]'::jsonb;
  v jsonb;
  v_menu1 uuid; v_menu2 uuid; v_menu3 uuid; v_card uuid; v_home1 uuid; v_home2 uuid; v_insta uuid; v_guide uuid; v_logo uuid;
begin
  -- Names are display-only; the demo users are created by the server with these names.
  insert into public.workspaces (id, name, slug, plan, is_demo, created_by, created_at)
  values (ws, 'Kestrel Studio', slug, 'pro', true, p_owner, n - interval '45 days');

  insert into public.clients (id, workspace_id, name, accent, created_at) values
    (c_nw, ws, 'Northwind Coffee', 'amber', n - interval '44 days'),
    (c_pc, ws, 'Pinecrest Dental', 'cyan', n - interval '30 days'),
    (c_jy, ws, 'Juniper Yoga', 'emerald', n - interval '10 days');

  update public.memberships set created_at = n - interval '45 days' where workspace_id = ws;
  insert into public.memberships (workspace_id, user_id, role, client_id, created_at) values
    (ws, p_member, 'member', null, n - interval '43 days'),
    (ws, p_client_a, 'client', c_nw, n - interval '36 days'),
    (ws, p_client_b, 'client', c_pc, n - interval '21 days');

  insert into public.invitations (workspace_id, email, role, client_id, token_hash, invited_by, created_at, expires_at)
  values (ws, 'ana@juniper-yoga.example', 'client', c_jy, encode(sha256(gen_random_uuid()::text::bytea), 'hex'), p_owner, n - interval '2 days', n + interval '5 days');

  -- ---------------- Northwind Coffee ----------------
  insert into public.deliverables (id, workspace_id, client_id, title, description, created_by, created_at) values
    (d_menu, ws, c_nw, 'Spring menu board', 'Main board behind the counter, 16:9 screen. Seasonal special to be confirmed.', p_member, n - interval '35 days'),
    (d_insta, ws, c_nw, 'Instagram launch post', 'First post of the spring campaign. Square format, goes live March 20.', p_member, n - interval '3 days'),
    (d_card, ws, c_nw, 'Loyalty card', 'Business-card size, front and back. Print run of 2,000.', p_owner, n - interval '7 days');

  v := private.demo_version(ws, c_nw, d_menu, 'northwind-menu-board-v1.png', 'image/png', p_sizes, p_member, n - interval '34 days', 'First pass with the full spring menu.');
  copies := copies || v; v_menu1 := (v ->> 'version_id')::uuid;
  v := private.demo_version(ws, c_nw, d_menu, 'northwind-menu-board-v2.png', 'image/png', p_sizes, p_member, n - interval '31 days', 'Prices are about 50% bigger and bolder.');
  copies := copies || v; v_menu2 := (v ->> 'version_id')::uuid;
  v := private.demo_version(ws, c_nw, d_menu, 'northwind-menu-board-v3.png', 'image/png', p_sizes, p_member, n - interval '28 days', 'Added the lavender honey latte as the seasonal special.');
  copies := copies || v; v_menu3 := (v ->> 'version_id')::uuid;
  v := private.demo_version(ws, c_nw, d_insta, 'northwind-instagram-launch.png', 'image/png', p_sizes, p_member, n - interval '3 days');
  copies := copies || v; v_insta := (v ->> 'version_id')::uuid;
  v := private.demo_version(ws, c_nw, d_card, 'northwind-loyalty-card.pdf', 'application/pdf', p_sizes, p_owner, n - interval '6 days');
  copies := copies || v; v_card := (v ->> 'version_id')::uuid;

  insert into public.reviews (deliverable_id, version_id, workspace_id, client_id, decision, note, reviewer_id, created_at) values
    (d_menu, v_menu1, ws, c_nw, 'changes_requested', 'The prices are hard to read from the counter. Can they be a lot bigger?', p_client_a, n - interval '33 days'),
    (d_menu, v_menu2, ws, c_nw, 'changes_requested', 'Much better! Can we add the seasonal special at the top? Lavender honey latte, $6.25.', p_client_a, n - interval '30 days'),
    (d_menu, v_menu3, ws, c_nw, 'approved', '', p_client_a, n - interval '27 days'),
    (d_card, v_card, ws, c_nw, 'changes_requested', 'Can the stamp circles be bigger? People will stamp them with a pen, not a stamp.', p_client_a, n - interval '4 days');

  update public.deliverables set status = 'approved', approval_requested_at = n - interval '28 days', decided_at = n - interval '27 days', updated_at = n - interval '27 days' where id = d_menu;
  update public.deliverables set status = 'in_review', approval_requested_at = n - interval '3 days', due_on = (n + interval '2 days')::date, updated_at = n - interval '3 days' where id = d_insta;
  update public.deliverables set status = 'changes_requested', approval_requested_at = n - interval '6 days', decided_at = n - interval '4 days', updated_at = n - interval '4 days' where id = d_card;

  -- ---------------- Pinecrest Dental ----------------
  insert into public.deliverables (id, workspace_id, client_id, title, description, created_by, created_at) values
    (d_guide, ws, c_pc, 'New patient guide', 'Three-page PDF sent to every new patient before their first visit.', p_owner, n - interval '13 days'),
    (d_home, ws, c_pc, 'Homepage design', 'Desktop homepage for the new website. Mobile follows once this is approved.', p_member, n - interval '24 days'),
    (d_poster, ws, c_pc, 'Waiting room poster', 'A3 poster for the waiting room. Still tweaking the headline.', p_member, n - interval '1 day');

  v := private.demo_version(ws, c_pc, d_guide, 'pinecrest-new-patient-guide.pdf', 'application/pdf', p_sizes, p_owner, n - interval '12 days');
  copies := copies || v; v_guide := (v ->> 'version_id')::uuid;
  v := private.demo_version(ws, c_pc, d_home, 'pinecrest-homepage-v1.png', 'image/png', p_sizes, p_member, n - interval '20 days');
  copies := copies || v; v_home1 := (v ->> 'version_id')::uuid;
  v := private.demo_version(ws, c_pc, d_home, 'pinecrest-homepage-v2.png', 'image/png', p_sizes, p_member, n - interval '16 days', 'Bigger headline, a secondary button, and the rating, wait time and weekend hours under it.');
  copies := copies || v; v_home2 := (v ->> 'version_id')::uuid;
  v := private.demo_version(ws, c_pc, d_poster, 'pinecrest-waiting-room-poster.png', 'image/png', p_sizes, p_member, n - interval '1 day');
  copies := copies || v;

  insert into public.reviews (deliverable_id, version_id, workspace_id, client_id, decision, note, reviewer_id, created_at) values
    (d_home, v_home1, ws, c_pc, 'changes_requested', 'Looks clean but a bit empty. Patients always ask about ratings, wait times and weekend hours.', p_client_b, n - interval '18 days'),
    (d_home, v_home2, ws, c_pc, 'approved', 'Perfect. Our front desk loves it.', p_client_b, n - interval '15 days');

  update public.deliverables set status = 'approved', approval_requested_at = n - interval '16 days', decided_at = n - interval '15 days', updated_at = n - interval '15 days' where id = d_home;
  update public.deliverables set status = 'in_review', approval_requested_at = n - interval '12 days', due_on = (n - interval '2 days')::date, updated_at = n - interval '12 days' where id = d_guide;
  update public.deliverables set updated_at = n - interval '1 day' where id = d_poster;

  -- ---------------- Juniper Yoga ----------------
  insert into public.deliverables (id, workspace_id, client_id, title, description, created_by, created_at) values
    (d_logo, ws, c_jy, 'Logo concepts, round 1', 'Three directions. Pick one to take forward, or mix elements.', p_owner, n - interval '9 days'),
    (d_sched, ws, c_jy, 'Class schedule poster', 'Spring term timetable for the studio window.', p_member, n - interval '5 days');
  v := private.demo_version(ws, c_jy, d_logo, 'juniper-logo-concepts.png', 'image/png', p_sizes, p_owner, n - interval '8 days');
  copies := copies || v; v_logo := (v ->> 'version_id')::uuid;
  v := private.demo_version(ws, c_jy, d_sched, 'juniper-class-schedule.png', 'image/png', p_sizes, p_member, n - interval '5 days');
  copies := copies || v;
  update public.deliverables set status = 'in_review', approval_requested_at = n - interval '8 days', due_on = (n + interval '5 days')::date, updated_at = n - interval '8 days' where id = d_logo;
  update public.deliverables set updated_at = n - interval '5 days' where id = d_sched;

  -- ---------------- Comments ----------------
  insert into public.comments (deliverable_id, workspace_id, client_id, version_id, author_id, body, created_at) values
    (d_menu, ws, c_nw, v_menu1, p_member, 'Here''s the first pass. Prices follow the sheet you sent on Monday.', n - interval '34 days'),
    (d_menu, ws, c_nw, v_menu1, p_client_a, 'Love the colors. I''ll check it from the counter tomorrow morning.', n - interval '34 days' + interval '3 hours'),
    (d_menu, ws, c_nw, v_menu3, p_member, 'Special is in. Kept the price in the same weight as the rest so it reads as part of the menu.', n - interval '28 days'),
    (d_menu, ws, c_nw, v_menu3, p_client_a, 'This is it. Sending it to the screen company today.', n - interval '27 days'),
    (d_insta, ws, c_nw, v_insta, p_member, 'Caption draft: "Spring is brewing. Lavender honey latte, from March 20." Happy to tweak.', n - interval '3 days'),
    (d_card, ws, c_nw, v_card, p_owner, 'Front is matte, back is uncoated so stamps don''t smudge.', n - interval '6 days'),
    (d_card, ws, c_nw, v_card, p_owner, 'Good call on the pen. We''ll go to 10 bigger circles in two rows.', n - interval '4 days' + interval '2 hours'),
    (d_guide, ws, c_pc, v_guide, p_owner, 'All three pages are here. Page 3 has the first-visit steps your front desk asked for.', n - interval '12 days'),
    (d_guide, ws, c_pc, v_guide, p_owner, 'Gentle nudge: the printer needs this by Friday to make the next batch.', n - interval '1 day'),
    (d_home, ws, c_pc, v_home2, p_client_b, 'The weekend hours line is going to save us so many phone calls.', n - interval '15 days'),
    (d_logo, ws, c_jy, v_logo, p_owner, 'My vote is B for the studio sign, but C would make lovely tote bags.', n - interval '8 days'),
    (d_poster, ws, c_pc, null, p_member, 'Internal: try a version with the Wi-Fi name bigger before we share it.', n - interval '20 hours');

  -- ---------------- Activity, rebuilt with the real story's timestamps ----------------
  delete from public.activity where workspace_id = ws;
  insert into public.activity (workspace_id, client_id, deliverable_id, actor_id, action, client_visible, metadata, created_at) values
    (ws, null, null, p_owner, 'workspace.created', false, '{}', n - interval '45 days'),
    (ws, null, null, p_member, 'member.joined', false, '{"role":"member"}', n - interval '43 days'),
    (ws, c_nw, null, p_owner, 'client.created', false, '{"name":"Northwind Coffee"}', n - interval '44 days'),
    (ws, c_nw, null, p_client_a, 'member.joined', true, '{"role":"client"}', n - interval '36 days'),
    (ws, c_nw, d_menu, p_member, 'version.uploaded', true, '{"version":1}', n - interval '34 days'),
    (ws, c_nw, d_menu, p_member, 'approval.requested', true, '{}', n - interval '34 days'),
    (ws, c_nw, d_menu, p_client_a, 'changes.requested', true, '{"note":"The prices are hard to read from the counter. Can they be a lot bigger?"}', n - interval '33 days'),
    (ws, c_nw, d_menu, p_member, 'version.uploaded', true, '{"version":2}', n - interval '31 days'),
    (ws, c_nw, d_menu, p_client_a, 'changes.requested', true, '{"note":"Much better! Can we add the seasonal special at the top?"}', n - interval '30 days'),
    (ws, c_pc, null, p_owner, 'client.created', false, '{"name":"Pinecrest Dental"}', n - interval '30 days'),
    (ws, c_nw, d_menu, p_member, 'version.uploaded', true, '{"version":3}', n - interval '28 days'),
    (ws, c_nw, d_menu, p_client_a, 'deliverable.approved', true, '{}', n - interval '27 days'),
    (ws, c_pc, null, p_client_b, 'member.joined', true, '{"role":"client"}', n - interval '21 days'),
    (ws, c_pc, d_home, p_member, 'version.uploaded', true, '{"version":1}', n - interval '20 days'),
    (ws, c_pc, d_home, p_client_b, 'changes.requested', true, '{"note":"Looks clean but a bit empty. Patients always ask about ratings, wait times and weekend hours."}', n - interval '18 days'),
    (ws, c_pc, d_home, p_member, 'version.uploaded', true, '{"version":2}', n - interval '16 days'),
    (ws, c_pc, d_home, p_client_b, 'deliverable.approved', true, '{"note":"Perfect. Our front desk loves it."}', n - interval '15 days'),
    (ws, c_pc, d_guide, p_owner, 'approval.requested', true, '{}', n - interval '12 days'),
    (ws, c_jy, null, p_owner, 'client.created', false, '{"name":"Juniper Yoga"}', n - interval '10 days'),
    (ws, c_jy, d_logo, p_owner, 'approval.requested', true, '{}', n - interval '8 days'),
    (ws, c_nw, d_card, p_owner, 'approval.requested', true, '{}', n - interval '6 days'),
    (ws, c_jy, d_sched, p_member, 'version.uploaded', false, '{"version":1}', n - interval '5 days'),
    (ws, c_nw, d_card, p_client_a, 'changes.requested', true, '{"note":"Can the stamp circles be bigger? People will stamp them with a pen, not a stamp."}', n - interval '4 days'),
    (ws, c_nw, d_insta, p_member, 'approval.requested', true, '{}', n - interval '3 days'),
    (ws, c_pc, d_guide, p_owner, 'comment.created', true, '{}', n - interval '1 day'),
    (ws, c_pc, d_poster, p_member, 'version.uploaded', false, '{"version":1}', n - interval '1 day');

  insert into public.demo_sandboxes (workspace_id, ip_hash, user_ids)
  values (ws, p_ip_hash, array[p_owner, p_member, p_client_a, p_client_b]);

  return jsonb_build_object('workspace_id', ws, 'slug', slug, 'northwind_client_id', c_nw, 'copies', copies);
end;
$$;

revoke all on function private.demo_version(uuid, uuid, uuid, text, text, jsonb, uuid, timestamptz, text) from public;
revoke all on function public.create_demo_workspace(uuid, uuid, uuid, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_demo_workspace(uuid, uuid, uuid, uuid, jsonb, text) to service_role;
