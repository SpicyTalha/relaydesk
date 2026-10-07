-- Clients must not see who else the agency works with.
-- Before: anyone sharing a workspace could read each other's profile, so a client of
-- Northwind could list the names of people at other clients of the same agency.
-- Now: team members see everyone in their workspace; clients see the team and people
-- in their own client space only.
create or replace function private.shares_workspace(other uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = other
      and (
        mine.role <> 'client'                  -- the team sees everyone in the workspace
        or theirs.role <> 'client'             -- clients see the team
        or theirs.client_id = mine.client_id   -- and people in their own client space
      )
  );
$$;
