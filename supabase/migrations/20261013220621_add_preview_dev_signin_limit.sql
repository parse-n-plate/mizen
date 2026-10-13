-- Apply to the separate staging project before deploying preview dev sign-in.
create schema if not exists dev_auth_private;
revoke all on schema dev_auth_private from public, anon, authenticated;
grant usage on schema dev_auth_private to service_role;

create table dev_auth_private.preview_dev_signin_limits (
  account_key text primary key check (account_key ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  attempts integer not null check (attempts between 1 and 10)
);
alter table dev_auth_private.preview_dev_signin_limits enable row level security;
revoke all on dev_auth_private.preview_dev_signin_limits from public, anon, authenticated;
grant select, insert, update on dev_auth_private.preview_dev_signin_limits to service_role;

create function public.consume_preview_dev_signin_attempt(p_account_key text)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
begin
  if p_account_key is null or p_account_key !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid account key' using errcode = '22023';
  end if;

  -- The unique row makes admission atomic across all preview workers.
  insert into dev_auth_private.preview_dev_signin_limits as limits
    (account_key, window_started_at, attempts)
  values (p_account_key, v_now, 1)
  on conflict (account_key) do update
    set window_started_at = case
          when limits.window_started_at <= v_now - interval '60 seconds' then v_now
          else limits.window_started_at end,
        attempts = case
          when limits.window_started_at <= v_now - interval '60 seconds' then 1
          else limits.attempts + 1 end
    where limits.window_started_at <= v_now - interval '60 seconds' or limits.attempts < 10
  returning window_started_at into v_window_started_at;

  if found then return 0; end if;

  select window_started_at into v_window_started_at
  from dev_auth_private.preview_dev_signin_limits where account_key = p_account_key;
  return greatest(1, ceil(extract(epoch from
    (v_window_started_at + interval '60 seconds' - clock_timestamp())))::integer);
end;
$$;

revoke all on function public.consume_preview_dev_signin_attempt(text) from public, anon, authenticated;
grant execute on function public.consume_preview_dev_signin_attempt(text) to service_role;
