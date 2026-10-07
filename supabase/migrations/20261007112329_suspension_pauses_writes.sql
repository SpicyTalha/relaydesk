-- A suspended studio is read-only: everything stays viewable and downloadable, but nothing new
-- is written until a platform admin lifts the suspension. Enforced here, so no code path can skip it.

create function private.block_suspended()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.workspaces where id = new.workspace_id and suspended_at is not null) then
    raise exception 'This studio is suspended, so changes are paused.' using errcode = 'P0001', hint = 'suspended';
  end if;
  return new;
end;
$$;

create trigger clients_suspended before insert on public.clients for each row execute function private.block_suspended();
create trigger deliverables_suspended before insert on public.deliverables for each row execute function private.block_suspended();
create trigger deliverable_versions_suspended before insert on public.deliverable_versions for each row execute function private.block_suspended();
create trigger comments_suspended before insert on public.comments for each row execute function private.block_suspended();
create trigger reviews_suspended before insert on public.reviews for each row execute function private.block_suspended();
create trigger invitations_suspended before insert on public.invitations for each row execute function private.block_suspended();
create trigger revision_checklists_suspended before insert on public.revision_checklists for each row execute function private.block_suspended();
