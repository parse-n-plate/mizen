# Recipe prep notes (GAG-137)

Recipe imports automatically extract actionable prerequisites, including clearly supported inferred tasks. Advance tasks carry an icon; known lead times are explicit. Required tasks and recommendations are labeled. Empty or invalid enrichment does not add a card or fail the recipe import. Cooking-step tips remain in the Cook tab.

The Prep tab shows every extracted task above ingredients. Its preview prioritizes advance tasks, then longer lead times, then requirements over recommendations. Completion collapses the card; reopening allows undoing tasks.

Author review decision: no mandatory review gate for imported recipes. The app has no author editing/publication workflow. Notes accompany the imported recipe when it is saved and shared. A future author workflow can expose editing of the structured `prepNotes` field.

## Persistence and rollout

Apply `supabase/migrations/20260907094329_add_recipe_prep_completion.sql` before deploying this branch. The migration has been tested in an isolated PostgreSQL runtime, including authenticated per-item upserts, user isolation, ownership reassignment prevention, and denial of anonymous access. It has not been applied to the live Supabase project.

Signed-in completion is stored per user, recipe identity, and task identity, independently of recipe content. Opening a recipe or returning to the window refreshes state from the server. Individual writes avoid overwriting another device's unrelated checklist changes. Failed writes roll back and show a retryable error. Guest completion is stored locally and is separate from signed-in completion.

Notes are generated on import. Existing saved recipes need to be re-imported to receive notes; there is no bulk backfill. Imported source URLs identify recipes consistently across saved and shared views. Recipes without a source URL use a digest of their original title, ingredients, and instruction text. Edited task text or timing invalidates that task's completion.

## Verification

Run `npm run typecheck` and `npm run test:run`. Focused tests cover all four extraction paths, task ordering, empty cards, reload persistence, account changes, cross-device refresh, API ownership, and failed-write rollback.

The Banana Bread Cookies demo includes advance chilling and same-day oven setup for browser verification. Desktop and 390px mobile checks confirmed card placement, checklist controls, completion collapse, and reload persistence.
