alter table public.recipes
  add column if not exists is_favorite boolean not null default false;

-- Recipes saved before favorites were introduced were intentionally saved by
-- the user, so preserve that intent when the field is added.
update public.recipes
set is_favorite = true
where is_favorite = false;
