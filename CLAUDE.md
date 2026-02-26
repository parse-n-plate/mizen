# Baby Mizen

Recipe parser app. Paste a URL, get a clean recipe.

## Ethos — Read this before every change

Baby Mizen is the simplified version refactor of the full Mizen app. Before adding anything, ask: "Does a baby app need this?"

- **Simple over smart.** No abstractions, no premature patterns, no "just in case" code.
- **Don't port complexity from Mizen.** If you reference the full app for inspiration, strip it down to the bare minimum. No drag-reorder, no resize handles, no hover cards, no context menus.
- **If it works and it's readable, it's done.** Don't refactor what isn't broken.
- **UI = fast and clean.** No clutter, no unnecessary loading states, no extra wrappers.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4, shadcn/ui components
- Supabase (auth + database)
- Groq SDK for LLM recipe extraction
- Zod for validation

## Rules

- Use Solar icons (`solar-icon-set`) for all icons
- Use `src/` directory structure
- Server components by default, `"use client"` only when needed
- Keep API routes in `src/app/api/`
- Reusable UI components go in `src/components/ui/`
- Feature components go in `src/components/`
- Never commit `.env.local` or secrets
