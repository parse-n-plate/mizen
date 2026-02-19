# Agent instructions — Parse-n-Plate (Brisbane)

This file gives AI coding agents shared context and rules for this project. Use it across Cursor, Copilot, Codex, Aider, Zed, and other tools that read AGENTS.md.

---

## Project overview

- **TypeScript** — Strict types; avoid `any`; define interfaces for complex data.
- **React** — Functional components and hooks only.
- **Next.js** — App Router; use for routing and project structure.
- **Icons** — **Solar Icons** only. Prefer **filled** unless asked otherwise. [Solar Icons](https://icons.solar/).
- **Styling** — CSS Modules and Tailwind; see `src/app/globals.css` for tokens and base styles.
- **Errors** — Use Error Boundaries for async and error handling in the UI.

---

## User context (who you’re helping)

- **Audience:** Product designer with limited coding experience.
- **Communication:** Explain step-by-step; use clear visual signals: ⚠️ 🛑 ⏸️ 📋 ✅.
- **Learning:** Prefer smaller, incremental changes and “why” explanations.
- **Risk:** For large or risky changes, warn explicitly (e.g. “⚠️ LARGE CHANGE” or “🛑 HIGH RISK”) and wait for confirmation before applying.

---

## Coding and review

- Add clear comments that explain **what** and **why**.
- For large/risky changes: signal (⚠️ or 🛑), explain, and **wait for user confirmation** before proceeding.
- Use explicit TypeScript types; avoid `any`; define interfaces for complex data.
- Use functional React components, hooks, and error boundaries for async work.

---

## UI and components

- **Global CSS:** When changing or adding anything under `components/ui/`, review and update `src/app/globals.css` as needed (variables, utilities, base/components/utilities).
- **Design tokens:** When in doubt, put shared tokens and styles in `globals.css`.
- **Dropdowns / popovers:** Use `modal={false}` to avoid scroll lock and layout shift.

---

## Dev environment and commands

- `npm run dev` — Start dev server.
- `npm run build` — Production build.
- `npm run lint` — Lint (and fix where supported).
- `npm run docker:*` — Docker build/run.

---

## Workflow and docs

- Update docs (e.g. README) for new features, breaking changes, or non-obvious logic.
- Before large changes: signal, explain, get confirmation.
- After changes: summarize what changed, suggest how to test, and remind about changelogs if relevant.
