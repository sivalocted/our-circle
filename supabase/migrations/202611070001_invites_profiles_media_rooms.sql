-- Private family platform foundations. Review and apply only to a dedicated
-- staging Supabase project after OAuth and administrator ownership are verified.
-- No service-role credentials are needed in the browser.

create extension if not exists pgcrypto with schema extensions;

-- The designated owner is bootstrapped as an email-only admin row. The role is
-- stored in the database and never derived from user-editable auth metadata.
insert into public.family_members (email, role, is_active)
select 'sirivurisiva@gmail.com', 'admin', true
where not exists (select 1 from public.family_members where lower(email)='sirivurisiva@gmail.com');
update public.family_members set role='admin',is_active=true where lower(email)='sirivurisiva@gmail.com';

-- Require an active membership tied to a confirmed auth.users identity.
create or replace function public.is_family_member()
returns boolean language sql stable security definer set search_path=public,auth
as $$ select exists (
  select 1 from public.family_members m join auth.users u on lower(u.email)=lower(m.email)
  where m.is_active and m.email=lower(coalesce(auth.jwt()->>'email',''))
    and u.id=auth.uid() and u.email_confirmed_at is not null
) $$;
create or replace function public.is_family_admin()
returns boolean language sql stable security definer set search_path=public,auth
as $$ select exists (
  select 1 from public.family_members m join auth.users u on lower(u.email)=lower(m.email)
  where m.is_active and m.role='admin' and m.email=lower(coalesce(auth.jwt()->>'email',''))
    and u.id=auth.uid() and u.email_confirmed_at is not null
) $$;
revoke all on function public.is_family_member(),public.is_family_admin() from public,anon;
grant execute on function public.is_family_member(),public.is_family_admin() to authenticated;

create table if not exists public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  constraint family_invitations_normalized_email check (email = lower(trim(email))),
  constraint family_invitations_gmail_only check (email ~ '^[a-z0-9][a-z0-9._%+-]*@gmail\.com$'),
  constraint family_invitations_expiry check (expires_at > created_at)
);
create unique index if not exists family_invitations_one_pending_per_email
  on public.family_invitations(email) where status = 'pending';
create index if not exists family_invitations_admin_list_idx
  on public.family_invitations(status, created_at desc);
alter table public.family_invitations enable row level security;
create policy family_invitations_admin_read on public.family_invitations for select to authenticated using (public.is_family_admin());
revoke all on public.family_invitations from anon, authenticated;
grant select on public.family_invitations to authenticated;

create or replace function public.create_family_invitation(p_email text)
returns uuid language plpgsql security definer set search_path = public, auth, extensions
as $$
declare normalized_email text := lower(trim(coalesce(p_email,''))); invitation_id uuid;
begin
  if not public.is_family_admin() then raise exception 'administrator access required' using errcode = '42501'; end if;
  if normalized_email !~ '^[a-z0-9][a-z0-9._%+-]*@gmail\.com$' then raise exception 'a valid Gmail address is required' using errcode = '22023'; end if;
  if exists (select 1 from public.family_members where email = normalized_email and is_active) then raise exception 'this address is already an active member' using errcode = '23505'; end if;
  update public.family_invitations set status='expired' where email=normalized_email and status='pending' and expires_at <= now();
  if exists (select 1 from public.family_invitations where email=normalized_email and status='pending') then raise exception 'a pending invitation already exists' using errcode = '23505'; end if;
  insert into public.family_invitations(email, invited_by) values (normalized_email, auth.uid()) returning id into invitation_id;
  return invitation_id;
end $$;
revoke all on function public.create_family_invitation(text) from public, anon;
grant execute on function public.create_family_invitation(text) to authenticated;

create or replace function public.revoke_family_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = public, auth
as $$
begin
  if not public.is_family_admin() then raise exception 'administrator access required' using errcode = '42501'; end if;
  update public.family_invitations set status='revoked', revoked_at=now()
  where id=p_invitation_id and status='pending';
  if not found then raise exception 'pending invitation not found' using errcode = 'P0002'; end if;
end $$;
revoke all on function public.revoke_family_invitation(uuid) from public, anon;
grant execute on function public.revoke_family_invitation(uuid) to authenticated;

create or replace function public.set_family_member_access(p_email text,p_active boolean,p_role text default 'cousin')
returns void language plpgsql security definer set search_path=public,auth
as $$ declare target_email text := lower(trim(coalesce(p_email,'')));
begin
  if not public.is_family_admin() then raise exception 'administrator access required' using errcode='42501'; end if;
  if target_email='sirivurisiva@gmail.com' then raise exception 'the designated owner role is protected' using errcode='42501'; end if;
  if p_role not in ('admin','cousin') then raise exception 'invalid role' using errcode='22023'; end if;
  update public.family_members set is_active=p_active,role=p_role where email=target_email;
  if not found then raise exception 'member not found' using errcode='P0002'; end if;
end $$;
revoke all on function public.set_family_member_access(text,boolean,text) from public,anon;
grant execute on function public.set_family_member_access(text,boolean,text) to authenticated;

create or replace function public.accept_family_invitation()
returns text language plpgsql security definer set search_path = public, auth
as $$
declare verified_email text;
begin
  select lower(email) into verified_email from auth.users
    where id=auth.uid() and email_confirmed_at is not null;
  if verified_email is null then raise exception 'a verified Google email is required' using errcode = '42501'; end if;
  update public.family_invitations set status='expired'
    where email=verified_email and status='pending' and expires_at <= now();
  if not exists (select 1 from public.family_invitations where email=verified_email and status='pending' and expires_at > now()) then
    if exists (select 1 from public.family_members where email=verified_email and is_active) then return 'already_member'; end if;
    raise exception 'no active invitation for this verified email' using errcode = '42501';
  end if;
  insert into public.family_members(email,role,is_active)
    select verified_email,'cousin',true
    where not exists(select 1 from public.family_members where lower(email)=verified_email);
  update public.family_members set is_active=true
    where lower(email)=verified_email and role <> 'admin';
  update public.family_invitations set status='accepted', accepted_at=now()
    where email=verified_email and status='pending';
  return 'accepted';
end $$;
revoke all on function public.accept_family_invitation() from public, anon;
grant execute on function public.accept_family_invitation() to authenticated;

-- Separate public profile fields from birthday data so email and birthday year
-- are never exposed by the family directory.
create table if not exists public.family_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  avatar_path text,
  introduction text check (introduction is null or char_length(introduction) <= 280),
  preferred_timezone text not null default 'Asia/Kolkata',
  arrival_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.family_profile_private (
  user_id uuid primary key references auth.users(id) on delete cascade,
  birthday date,
  birthday_visibility text not null default 'private' check (birthday_visibility in ('private','members')),
  birthday_year_visible boolean not null default false
);
alter table public.family_profiles enable row level security;
alter table public.family_profile_private enable row level security;
create policy family_profiles_member_read on public.family_profiles for select to authenticated using (public.is_family_member());
create policy family_profiles_self_insert on public.family_profiles for insert to authenticated with check (public.is_family_member() and user_id=auth.uid());
create policy family_profiles_self_update on public.family_profiles for update to authenticated using (public.is_family_member() and user_id=auth.uid()) with check (public.is_family_member() and user_id=auth.uid());
create policy family_profiles_self_or_admin_delete on public.family_profiles for delete to authenticated using (public.is_family_member() and (user_id=auth.uid() or public.is_family_admin()));
create policy family_profile_private_self_read on public.family_profile_private for select to authenticated using (public.is_family_member() and (user_id=auth.uid() or public.is_family_admin()));
create policy family_profile_private_self_insert on public.family_profile_private for insert to authenticated with check (public.is_family_member() and user_id=auth.uid());
create policy family_profile_private_self_update on public.family_profile_private for update to authenticated using (public.is_family_member() and user_id=auth.uid()) with check (public.is_family_member() and user_id=auth.uid());
grant select,insert,update,delete on public.family_profiles to authenticated;
grant select,insert,update on public.family_profile_private to authenticated;

create or replace function public.complete_family_profile(
  p_display_name text, p_birthday date default null, p_birthday_visibility text default 'private',
  p_birthday_year_visible boolean default false, p_introduction text default null,
  p_preferred_timezone text default 'Asia/Kolkata'
) returns void language plpgsql security definer set search_path=public,auth
as $$
begin
  if not public.is_family_member() then raise exception 'active family membership required' using errcode='42501'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 1 and 80 then raise exception 'display name must be 1-80 characters' using errcode='22023'; end if;
  if p_birthday_visibility not in ('private','members') then raise exception 'invalid birthday visibility' using errcode='22023'; end if;
  if char_length(coalesce(p_introduction,'')) > 280 then raise exception 'introduction is too long' using errcode='22023'; end if;
  insert into public.family_profiles(user_id,display_name,introduction,preferred_timezone)
   values(auth.uid(),trim(p_display_name),nullif(trim(p_introduction),''),coalesce(nullif(p_preferred_timezone,''),'Asia/Kolkata'))
   on conflict(user_id) do update set display_name=excluded.display_name,introduction=excluded.introduction,preferred_timezone=excluded.preferred_timezone,updated_at=now();
  insert into public.family_profile_private(user_id,birthday,birthday_visibility,birthday_year_visible)
   values(auth.uid(),p_birthday,p_birthday_visibility,p_birthday_year_visible)
   on conflict(user_id) do update set birthday=excluded.birthday,birthday_visibility=excluded.birthday_visibility,birthday_year_visible=excluded.birthday_year_visible;
end $$;
revoke all on function public.complete_family_profile(text,date,text,boolean,text,text) from public,anon;
grant execute on function public.complete_family_profile(text,date,text,boolean,text,text) to authenticated;

create or replace view public.family_directory with (security_barrier=true) as
 select p.user_id,p.display_name,p.avatar_path,p.introduction,p.preferred_timezone,p.created_at,
   case when d.birthday_visibility='members' then to_char(d.birthday,'MM-DD') else null end as birthday_month_day,
   case when d.birthday_visibility='members' and d.birthday_year_visible then extract(year from d.birthday)::integer else null end as birthday_year
 from public.family_profiles p join public.family_profile_private d using(user_id)
 where public.is_family_member();
grant select on public.family_directory to authenticated;

-- Birthdays are derived at read time; no annual duplicate calendar rows.
create or replace function public.upcoming_family_birthdays(p_days integer default 60)
returns table(user_id uuid, display_name text, birthday_date date, days_until integer)
language sql stable security invoker set search_path=public
as $$
  with today as (select (now() at time zone 'Asia/Kolkata')::date d), birthdays as (
   select p.user_id,p.display_name,make_date(extract(year from t.d)::int,extract(month from pr.birthday)::int,extract(day from pr.birthday)::int) next_day,t.d
   from public.family_profiles p join public.family_profile_private pr using(user_id) cross join today t
   where public.is_family_member() and pr.birthday_visibility='members' and pr.birthday is not null
  ), adjusted as (select user_id,display_name,case when next_day < d then (next_day + interval '1 year')::date else next_day end birthday_date,d from birthdays)
  select user_id,display_name,birthday_date,(birthday_date-d)::int from adjusted
  where birthday_date-d between 0 and least(greatest(p_days,0),366) order by birthday_date limit 50;
$$;
grant execute on function public.upcoming_family_birthdays(integer) to authenticated;

-- Private object store: every object is scoped to its owning member. A service
-- must authorize family reads with short-lived signed URLs before media ships.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('family-memories','family-memories',false,20971520,array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm'])
on conflict(id) do update set public=false,file_size_limit=20971520,allowed_mime_types=excluded.allowed_mime_types;
create policy family_media_member_list on storage.objects for select to authenticated
 using(bucket_id='family-memories' and public.is_family_member());
create policy family_media_owner_upload on storage.objects for insert to authenticated
 with check(bucket_id='family-memories' and public.is_family_member() and (storage.foldername(name))[1]=auth.uid()::text);
create policy family_media_owner_update on storage.objects for update to authenticated
 using(bucket_id='family-memories' and public.is_family_member() and (storage.foldername(name))[1]=auth.uid()::text)
 with check(bucket_id='family-memories' and public.is_family_member() and (storage.foldername(name))[1]=auth.uid()::text);
create policy family_media_owner_or_admin_delete on storage.objects for delete to authenticated
 using(bucket_id='family-memories' and public.is_family_member() and ((storage.foldername(name))[1]=auth.uid()::text or public.is_family_admin()));

create table if not exists public.memory_reactions(
  memory_path text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check(emoji in ('❤️','😂','🥰','👏','✨')),
  created_at timestamptz not null default now(),
  primary key(memory_path,user_id,emoji)
);
alter table public.memory_reactions enable row level security;
create policy memory_reactions_members_read on public.memory_reactions for select to authenticated using(public.is_family_member());
create policy memory_reactions_self_write on public.memory_reactions for insert to authenticated with check(public.is_family_member() and user_id=auth.uid());
create policy memory_reactions_self_delete on public.memory_reactions for delete to authenticated using(public.is_family_member() and user_id=auth.uid());
grant select,insert,delete on public.memory_reactions to authenticated;

-- Group chat retention: 30 days by default, server-controlled, no client delete.
create table if not exists public.family_settings(
  id boolean primary key default true check(id),
  chat_retention_days integer not null default 30 check(chat_retention_days between 7 and 365),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
insert into public.family_settings(id) values(true) on conflict do nothing;
alter table public.family_settings enable row level security;
create policy family_settings_admin_read on public.family_settings for select to authenticated using(public.is_family_admin());
create policy family_settings_admin_update on public.family_settings for update to authenticated using(public.is_family_admin()) with check(public.is_family_admin());
revoke all on public.family_settings from anon,authenticated;
grant select,update on public.family_settings to authenticated;
create or replace function public.purge_expired_chat_messages()
returns bigint language plpgsql security definer set search_path=public
as $$ declare removed bigint; retention integer;
begin
 select chat_retention_days into retention from public.family_settings where id=true;
 delete from public.chat_messages where created_at < now() - make_interval(days=>coalesce(retention,30));
 get diagnostics removed=row_count; return removed;
end $$;
revoke all on function public.purge_expired_chat_messages() from public,anon,authenticated;

-- Basic multiplayer room registry; only RPCs may mutate room state. Game-specific
-- move validation and server-authoritative scoring are still required before play.
create table if not exists public.game_rooms(
 id uuid primary key default gen_random_uuid(),
 room_code text not null unique default upper(encode(gen_random_bytes(4),'hex')),
 game_id text not null check(game_id in ('tic_tac_toe','connect_four','draw_guess','imposter','caption_contest','story_chain')),
 host_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'lobby' check(status in ('lobby','playing','finished','expired')),
 state jsonb not null default '{}'::jsonb,
 expires_at timestamptz not null default now()+interval '3 hours',
 created_at timestamptz not null default now()
);
create table if not exists public.game_room_players(
 room_id uuid not null references public.game_rooms(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 ready boolean not null default false,
 team smallint,
 joined_at timestamptz not null default now(),
 primary key(room_id,user_id)
);
create index if not exists game_rooms_open_idx on public.game_rooms(status,expires_at) where status in ('lobby','playing');
create index if not exists game_players_user_idx on public.game_room_players(user_id,joined_at desc);
alter table public.game_rooms enable row level security;
alter table public.game_room_players enable row level security;
create or replace function public.is_game_room_player(p_room_id uuid)
returns boolean language sql stable security definer set search_path=public,auth
as $$ select exists(select 1 from public.game_room_players p where p.room_id=p_room_id and p.user_id=auth.uid()) $$;
revoke all on function public.is_game_room_player(uuid) from public,anon;
grant execute on function public.is_game_room_player(uuid) to authenticated;
create policy game_rooms_players_read on public.game_rooms for select to authenticated using(public.is_family_member() and public.is_game_room_player(id));
create policy game_room_players_room_read on public.game_room_players for select to authenticated using(public.is_family_member() and public.is_game_room_player(room_id));
revoke all on public.game_rooms,public.game_room_players from anon,authenticated;
grant select on public.game_rooms,public.game_room_players to authenticated;

create or replace function public.create_game_room(p_game_id text)
returns table(room_id uuid,room_code text) language plpgsql security definer set search_path=public,auth,extensions
as $$ declare new_id uuid; new_code text;
begin
 if not public.is_family_member() then raise exception 'active family membership required' using errcode='42501'; end if;
 if p_game_id not in ('tic_tac_toe','connect_four','draw_guess','imposter','caption_contest','story_chain') then raise exception 'unsupported multiplayer game' using errcode='22023'; end if;
 insert into public.game_rooms(game_id,host_id) values(p_game_id,auth.uid()) returning id,game_rooms.room_code into new_id,new_code;
 insert into public.game_room_players(room_id,user_id) values(new_id,auth.uid());
 return query select new_id,new_code;
end $$;
create or replace function public.join_game_room(p_room_code text)
returns uuid language plpgsql security definer set search_path=public,auth
as $$ declare target_id uuid;
begin
 if not public.is_family_member() then raise exception 'active family membership required' using errcode='42501'; end if;
 select id into target_id from public.game_rooms where room_code=upper(trim(p_room_code)) and status='lobby' and expires_at>now();
 if target_id is null then raise exception 'room not found or no longer joinable' using errcode='P0002'; end if;
 insert into public.game_room_players(room_id,user_id) values(target_id,auth.uid()) on conflict do nothing;
 return target_id;
end $$;
revoke all on function public.create_game_room(text),public.join_game_room(text) from public,anon;
grant execute on function public.create_game_room(text),public.join_game_room(text) to authenticated;

-- Leaderboards are bounded at the database boundary; score submission is not
-- exposed until per-game server validation exists.
create table if not exists public.game_scores(
 id uuid primary key default gen_random_uuid(),game_id text not null,user_id uuid not null references auth.users(id) on delete cascade,
 score integer not null check(score>=0),created_at timestamptz not null default now()
);
create index if not exists game_scores_top15_idx on public.game_scores(game_id,score desc,created_at asc);
alter table public.game_scores enable row level security;
revoke all on public.game_scores from anon,authenticated;
create or replace function public.top_game_scores(p_game_id text)
returns table(rank bigint,display_name text,score integer,achieved_at timestamptz)
language sql stable security invoker set search_path=public
as $$ select row_number() over(order by s.score desc,s.created_at asc),p.display_name,s.score,s.created_at
 from public.game_scores s join public.family_profiles p on p.user_id=s.user_id
 where public.is_family_member() and s.game_id=p_game_id order by s.score desc,s.created_at asc limit 15 $$;
revoke all on function public.top_game_scores(text) from public,anon;
grant execute on function public.top_game_scores(text) to authenticated;

