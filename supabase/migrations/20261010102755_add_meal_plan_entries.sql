create table public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  planned_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id, planned_date)
);
create index meal_plan_entries_user_week_idx on public.meal_plan_entries (user_id, planned_date);
create index meal_plan_entries_recipe_idx on public.meal_plan_entries (recipe_id);

alter table public.meal_plan_entries enable row level security;
revoke all on public.meal_plan_entries from anon;
grant select, insert, delete on public.meal_plan_entries to authenticated;

create policy "Read own meal plan" on public.meal_plan_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Schedule own saved recipes" on public.meal_plan_entries
  for insert to authenticated with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.recipes
      where recipes.id = recipe_id and recipes.user_id = (select auth.uid())
    )
  );
create policy "Remove own planned meals" on public.meal_plan_entries
  for delete to authenticated using ((select auth.uid()) = user_id);
