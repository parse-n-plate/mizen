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
