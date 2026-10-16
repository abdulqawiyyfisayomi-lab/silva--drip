create table if not exists public.orders (
 reference text primary key,
 user_id uuid not null references auth.users(id),
 email text not null,
 amount bigint not null check (amount > 0),
 currency text not null default 'NGN' check (currency = 'NGN'),
 items jsonb not null,
 shipping jsonb not null,
 status text not null default 'pending' check (status in ('pending','paid')),
 created_at timestamptz not null default now(),
 paid_at timestamptz
);
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
drop policy if exists "Customers see own orders" on public.orders;
create policy "Customers see own orders" on public.orders for select to authenticated using ((select auth.uid()) = user_id);
