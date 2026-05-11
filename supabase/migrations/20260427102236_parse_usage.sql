-- Daily usage counter for /api/parse to prevent abuse.
-- Identity is exactly one of (user_id, ip_hash). Service-role only — RLS
-- enabled with no policies so anon/authenticated clients can't touch it.

create table if not exists public.parse_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  ip_hash text,
  date date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint parse_usage_identity_check
    check ((user_id is null) <> (ip_hash is null))
);

create unique index if not exists parse_usage_user_date
  on public.parse_usage (user_id, date)
  where user_id is not null;

create unique index if not exists parse_usage_ip_date
  on public.parse_usage (ip_hash, date)
  where ip_hash is not null;

alter table public.parse_usage enable row level security;

-- Atomic increment + check. Returns the new count and whether it's still
-- within the limit. Caller decides whether to allow the request based on
-- `allowed`.
create or replace function public.increment_parse_usage(
  p_user_id uuid,
  p_ip_hash text,
  p_limit integer
)
returns table (allowed boolean, used integer, "limit" integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_count integer;
begin
  if (p_user_id is null) = (p_ip_hash is null) then
    raise exception 'increment_parse_usage requires exactly one of p_user_id or p_ip_hash';
  end if;

  if p_user_id is not null then
    insert into public.parse_usage (user_id, date, count)
    values (p_user_id, v_today, 1)
    on conflict (user_id, date) where user_id is not null
      do update set count = public.parse_usage.count + 1, updated_at = now()
    returning public.parse_usage.count into v_count;
  else
    insert into public.parse_usage (ip_hash, date, count)
    values (p_ip_hash, v_today, 1)
    on conflict (ip_hash, date) where ip_hash is not null
      do update set count = public.parse_usage.count + 1, updated_at = now()
    returning public.parse_usage.count into v_count;
  end if;

  return query
    select
      v_count <= p_limit,
      v_count,
      p_limit,
      ((v_today + 1)::timestamp at time zone 'utc');
end;
$$;

revoke all on function public.increment_parse_usage(uuid, text, integer) from public;
grant execute on function public.increment_parse_usage(uuid, text, integer) to service_role;
