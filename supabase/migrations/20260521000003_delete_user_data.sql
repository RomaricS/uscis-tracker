-- Function to delete all data for a user (called from the mobile app on "Delete Account")
create or replace function delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verify the caller is the user themselves
  if auth.uid() != target_user_id then
    raise exception 'Not authorized';
  end if;

  delete from cases where user_id = target_user_id;
end;
$$;

revoke execute on function delete_user_data(uuid) from public;
grant execute on function delete_user_data(uuid) to authenticated;
