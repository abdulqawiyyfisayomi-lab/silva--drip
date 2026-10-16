begin;
do $$
begin
  if (select count(*) from auth.users where lower(email)='abdulqawiyyfisayomi@gmail.com' and email_confirmed_at is not null) <> 1 then
    raise exception 'The owner must have one confirmed account before running this update.';
  end if;
end $$;
update auth.users
set raw_app_meta_data = (coalesce(raw_app_meta_data, '{}'::jsonb) - 'store_admin') ||
case when lower(email)='abdulqawiyyfisayomi@gmail.com' then '{"store_admin":true}'::jsonb else '{}'::jsonb end;
create or replace function public.is_store_owner() returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from auth.users u where u.id=auth.uid() and lower(u.email)='abdulqawiyyfisayomi@gmail.com' and u.email_confirmed_at is not null and u.raw_app_meta_data->>'store_admin'='true');
$$;
revoke all on function public.is_store_owner() from public;
grant execute on function public.is_store_owner() to authenticated;
drop policy if exists "Store admin photo upload" on storage.objects;
create policy "Store admin photo upload" on storage.objects for insert to authenticated
with check(bucket_id='product-photos' and public.is_store_owner());
commit;
select email from auth.users where raw_app_meta_data->>'store_admin'='true';
