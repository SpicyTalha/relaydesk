-- Red-pen pins in every new demo copy, so visitors see the feature already in use:
-- Daniel's notes on the menu board and Priya's on the clinic homepage, all since resolved.
-- Called by the server right after create_demo_workspace(); service role only.

create or replace function public.seed_demo_pins(p_workspace uuid)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  n timestamptz := now();
  v_member uuid;
  inserted integer;
begin
  if not exists (select 1 from public.workspaces where id = p_workspace and is_demo) then
    raise exception 'Not a demo workspace.' using errcode = '42501';
  end if;
  select user_id into v_member from public.memberships where workspace_id = p_workspace and role = 'member' limit 1;

  with spots (title, version, client_name, body, x, y, made, resolved) as (
    values
      ('Spring menu board', 1, 'Northwind Coffee', 'These are impossible to read from behind the counter.', 0.93, 0.62, n - interval '33 days', n - interval '31 days'),
      ('Spring menu board', 2, 'Northwind Coffee', 'Seasonal special up here: lavender honey latte, $6.25.', 0.50, 0.22, n - interval '30 days', n - interval '28 days'),
      ('Homepage design', 1, 'Pinecrest Dental', 'Empty down here. Could our Google rating go here?', 0.25, 0.82, n - interval '18 days', n - interval '16 days'),
      ('Homepage design', 1, 'Pinecrest Dental', 'Can this card show the wait time too?', 0.66, 0.73, n - interval '18 days' + interval '2 minutes', n - interval '16 days')
  ), resolved as (
    select d.id as deliverable_id, d.client_id, v.id as version_id, m.user_id as author_id, s.*
    from spots s
    join public.deliverables d on d.workspace_id = p_workspace and d.title = s.title
    join public.clients c on c.id = d.client_id and c.name = s.client_name
    join public.deliverable_versions v on v.deliverable_id = d.id and v.version = s.version
    join public.memberships m on m.workspace_id = p_workspace and m.client_id = c.id and m.role = 'client'
  ), added as (
    insert into public.comments (deliverable_id, workspace_id, client_id, version_id, author_id, body, pin_x, pin_y, created_at, resolved_at, resolved_by)
    select deliverable_id, p_workspace, client_id, version_id, author_id, body, x, y, made, resolved, v_member from resolved
    returning id
  )
  select count(*) into inserted from added;

  -- These notes are history; the rebuilt activity feed already tells that story.
  delete from public.activity
   where workspace_id = p_workspace and action = 'comment.created' and created_at >= n - interval '1 minute';
  return inserted;
end;
$$;

revoke all on function public.seed_demo_pins(uuid) from public, anon, authenticated;
grant execute on function public.seed_demo_pins(uuid) to service_role;
