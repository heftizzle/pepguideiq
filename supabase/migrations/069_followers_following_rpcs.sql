-- Followers / following lists with viewer-relative follow state.

create or replace function public.get_followers(target_profile_id uuid)
returns table (
  id uuid,
  handle text,
  display_name text,
  avatar_r2_key text,
  plan text,
  is_following_by_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mp.id,
    mp.handle,
    mp.display_name,
    mp.avatar_r2_key,
    p.plan,
    exists (
      select 1
      from public.member_follows mef
      join public.member_profiles me on me.id = mef.follower_id
      where me.user_id = auth.uid()
        and mef.following_id = mp.id
    ) as is_following_by_me
  from public.member_follows mf
  join public.member_profiles mp
    on mp.id = mf.follower_id
  join public.profiles p on p.id = mp.user_id
  where mf.following_id = target_profile_id
  order by mf.created_at desc;
$$;

grant execute on function public.get_followers(uuid) to authenticated;

create or replace function public.get_following(target_profile_id uuid)
returns table (
  id uuid,
  handle text,
  display_name text,
  avatar_r2_key text,
  plan text,
  is_following_by_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mp.id,
    mp.handle,
    mp.display_name,
    mp.avatar_r2_key,
    p.plan,
    exists (
      select 1
      from public.member_follows mef
      join public.member_profiles me on me.id = mef.follower_id
      where me.user_id = auth.uid()
        and mef.following_id = mp.id
    ) as is_following_by_me
  from public.member_follows mf
  join public.member_profiles mp
    on mp.id = mf.following_id
  join public.profiles p on p.id = mp.user_id
  where mf.follower_id = target_profile_id
  order by mf.created_at desc;
$$;

grant execute on function public.get_following(uuid) to authenticated;
