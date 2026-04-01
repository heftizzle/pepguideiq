create table if not exists public.query_log (
  id          bigserial    primary key,
  user_id     uuid         references auth.users(id) on delete cascade,
  plan        text         not null default 'entry',
  model       text         not null,
  token_count integer      not null default 0,
  queried_at  timestamptz  not null default now()
);

alter table public.query_log enable row level security;

create policy "Users can view own query log"
  on public.query_log for select
  using (auth.uid() = user_id);

create index query_log_user_date_idx
  on public.query_log (user_id, queried_at desc);
