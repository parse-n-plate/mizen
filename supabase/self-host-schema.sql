-- Database setup for a self-hosted copy of Mizen.
-- Run this once in a new Supabase project (SQL Editor -> New query -> Run).
-- It creates the tables that the files in supabase/migrations change, so you
-- don't need to run those migrations on a new project.

-- Saved recipes. Shared links (/r/<slug>) are public, so anyone can read a
-- recipe. Only the owner can add, change, or remove it.
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  recipe jsonb not null,
  source_url text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_user_id_created_at_idx on public.recipes (user_id, created_at desc);

alter table public.recipes enable row level security;
grant select on public.recipes to anon, authenticated;
grant insert, update, delete on public.recipes to authenticated;

create policy "Anyone can read recipes" on public.recipes
  for select to anon, authenticated using (true);
create policy "Insert own recipes" on public.recipes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own recipes" on public.recipes
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Delete own recipes" on public.recipes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Checklist state is personal, including when viewing somebody else's shared recipe.
create table public.recipe_prep_completion (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_key text not null check (recipe_key ~ '^[a-f0-9]{64}$'),
  note_key text not null check (length(note_key) between 1 and 1000),
  completed boolean not null default false,
  primary key (user_id, recipe_key, note_key)
);

alter table public.recipe_prep_completion enable row level security;
grant select, insert, update on public.recipe_prep_completion to authenticated;
revoke all on public.recipe_prep_completion from anon;

create policy "Read own prep completion" on public.recipe_prep_completion
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own prep completion" on public.recipe_prep_completion
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own prep completion" on public.recipe_prep_completion
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
