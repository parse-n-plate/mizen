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
