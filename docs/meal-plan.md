# Meal Plan

Meal Plan is available at `/meal-plan` from desktop and mobile navigation. Users can browse Monday–Sunday weeks, search their saved recipes, add a recipe to a day, open a planned recipe, and remove it from the plan. Today returns to the current week and scrolls to the current day. Grocery lists are outside this release.

## Database setup

Apply `supabase/migrations/20261010102755_add_meal_plan_entries.sql` through the existing Supabase migration deployment process before using this feature. It creates the meal plan table, indexes, and account ownership policies. No remote database changes are applied automatically by the app.

A recipe can appear on multiple days, once per day. Repeated submissions are idempotent. Deleting a saved recipe removes its planned meals. Dates use the user's local calendar rather than UTC timestamps. Meal plans are private to the account that created them.

## Verification

Run lint, typecheck, tests, and build using the repository scripts. Tests cover week boundaries, invalid dates, authentication, recipe ownership, duplicate submissions, and scoped removal. Browser verification should cover adding a saved recipe, reloading, removing it, navigating weeks, jumping to today, and the mobile picker.
