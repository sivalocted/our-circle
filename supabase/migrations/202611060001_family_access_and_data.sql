-- Our Circle shared data foundation.
-- Review and apply to a dedicated Supabase project only after confirming the
-- intended family membership emails. This file does not seed real identities.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null default 'cousin' check (role in ('admin', 'cousin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint family_members_email_not_empty check (length(trim(email)) > 3),
  constraint family_members_email_lowercase check (email = lower(email))
);

create unique index if not exists family_members_email_lower_unique
  on public.family_members (lower(email));

create or replace function public.is_family_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members member
    where member.is_active
      and lower(member.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_family_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members member
    where member.is_active
      and member.role = 'admin'
      and lower(member.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_family_member() from public, anon;
revoke all on function public.is_family_admin() from public, anon;
grant execute on function public.is_family_member() to authenticated;
grant execute on function public.is_family_admin() to authenticated;

alter table public.family_members enable row level security;
drop policy if exists family_members_read_self_or_admin on public.family_members;
create policy family_members_read_self_or_admin on public.family_members
  for select to authenticated
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.is_family_admin()
  );
grant select on public.family_members to authenticated;
revoke insert, update, delete on public.family_members from anon, authenticated;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null default 'Circle member',
  sender_avatar text not null default '',
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_created_at_idx on public.chat_messages (created_at desc);
alter table public.chat_messages enable row level security;
drop policy if exists chat_messages_read_members on public.chat_messages;
create policy chat_messages_read_members on public.chat_messages
  for select to authenticated using (public.is_family_member());
drop policy if exists chat_messages_insert_self on public.chat_messages;
create policy chat_messages_insert_self on public.chat_messages
  for insert to authenticated
  with check (public.is_family_member() and sender_id = auth.uid());
grant select, insert on public.chat_messages to authenticated;
revoke update, delete on public.chat_messages from anon, authenticated;

create or replace function public.set_chat_sender_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  profile_name text;
  profile_avatar text;
begin
  select
    coalesce(nullif(user_row.raw_user_meta_data ->> 'full_name', ''),
             nullif(user_row.raw_user_meta_data ->> 'name', ''),
             split_part(coalesce(user_row.email, 'circle-member'), '@', 1)),
    coalesce(user_row.raw_user_meta_data ->> 'avatar_url', '')
  into profile_name, profile_avatar
  from auth.users user_row
  where user_row.id = auth.uid();

  new.sender_id := auth.uid();
  new.sender_name := coalesce(profile_name, 'Circle member');
  new.sender_avatar := coalesce(profile_avatar, '');
  return new;
end;
$$;

drop trigger if exists chat_messages_profile_before_insert on public.chat_messages;
create trigger chat_messages_profile_before_insert
  before insert on public.chat_messages
  for each row execute function public.set_chat_sender_profile();
revoke all on function public.set_chat_sender_profile() from public, anon, authenticated;

create table if not exists public.family_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  event_date date not null,
  category text not null check (category in ('birthday', 'trip', 'gathering', 'milestone')),
  description text check (description is null or char_length(description) <= 500),
  location text check (location is null or char_length(location) <= 160),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_events_date_idx on public.family_events (event_date);
alter table public.family_events enable row level security;
drop policy if exists family_events_read_members on public.family_events;
create policy family_events_read_members on public.family_events
  for select to authenticated using (public.is_family_member());
drop policy if exists family_events_insert_self on public.family_events;
create policy family_events_insert_self on public.family_events
  for insert to authenticated
  with check (public.is_family_member() and created_by = auth.uid());
drop policy if exists family_events_update_owner_or_admin on public.family_events;
create policy family_events_update_owner_or_admin on public.family_events
  for update to authenticated
  using (public.is_family_member() and (created_by = auth.uid() or public.is_family_admin()))
  with check (public.is_family_member() and (created_by = auth.uid() or public.is_family_admin()));
drop policy if exists family_events_delete_owner_or_admin on public.family_events;
create policy family_events_delete_owner_or_admin on public.family_events
  for delete to authenticated
  using (public.is_family_member() and (created_by = auth.uid() or public.is_family_admin()));
grant select, insert, update, delete on public.family_events to authenticated;

create table if not exists public.trip_goals (
  id boolean primary key default true check (id),
  destination text not null default '' check (char_length(destination) <= 120),
  target_amount numeric(12, 2) not null default 0 check (target_amount >= 0),
  departure_date date,
  description text not null default '' check (char_length(description) <= 500),
  banner_image text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.trip_goals enable row level security;
drop policy if exists trip_goals_read_members on public.trip_goals;
create policy trip_goals_read_members on public.trip_goals
  for select to authenticated using (public.is_family_member());
drop policy if exists trip_goals_admin_write on public.trip_goals;
create policy trip_goals_admin_write on public.trip_goals
  for all to authenticated
  using (public.is_family_member() and public.is_family_admin())
  with check (public.is_family_member() and public.is_family_admin());
grant select, insert, update, delete on public.trip_goals to authenticated;

create table if not exists public.trip_contributions (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  payment_provider text not null check (payment_provider in ('razorpay', 'upi')),
  provider_payment_id text unique,
  status text not null default 'pending' check (status in ('pending', 'verified', 'failed', 'refunded')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
alter table public.trip_contributions enable row level security;
drop policy if exists trip_contributions_read_members on public.trip_contributions;
create policy trip_contributions_read_members on public.trip_contributions
  for select to authenticated using (public.is_family_member());
grant select on public.trip_contributions to authenticated;
revoke insert, update, delete on public.trip_contributions from anon, authenticated;

create table if not exists public.trip_payment_settings (
  id boolean primary key default true check (id),
  beneficiary_name text not null,
  upi_id text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.trip_payment_settings enable row level security;
drop policy if exists trip_payment_settings_admin_only on public.trip_payment_settings;
create policy trip_payment_settings_admin_only on public.trip_payment_settings
  for all to authenticated
  using (public.is_family_member() and public.is_family_admin())
  with check (public.is_family_member() and public.is_family_admin());
grant select, insert, update, delete on public.trip_payment_settings to authenticated;

-- Private Realtime channels are authorized through active family membership.
alter table realtime.messages enable row level security;
drop policy if exists our_circle_realtime_select_members on realtime.messages;
create policy our_circle_realtime_select_members on realtime.messages
  for select to authenticated
  using (public.is_family_member() and topic like 'circle:%');
drop policy if exists our_circle_realtime_insert_members on realtime.messages;
create policy our_circle_realtime_insert_members on realtime.messages
  for insert to authenticated
  with check (public.is_family_member() and topic like 'circle:%');

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
    ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end;
$$;
