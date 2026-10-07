# Mizen (parse-n-plate)

Mizen is a Next.js cooking app for saving, organizing, and extracting recipes (Supabase auth/data, Groq for LLM extraction). See `CLAUDE.md` for stack and coding conventions.

## Commands

- Install dependencies: `npm ci`
- Local dev: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Tests: `npm run test:run`

Run lint, typecheck, and build (and tests when relevant) before finishing changes that touch app code, styling, config, or dependencies.

## Pull requests

When opening a PR, follow `.github/PULL_REQUEST_TEMPLATE.md` for titles and bodies. Remove the HTML comment and placeholder line from the template before submitting.

Writing guidelines:

- Use a short, direct title that says what changed.
- Keep the description short and proportional to the change; small fixes may need only two or three sentences.
- Start with the specific problem or user need; explain what changed and the result in plain language.
- **Plain language (required):** Write for a human reviewer who cares about the problem and outcome, not an implementation dump. Use everyday words; avoid engineering jargon when a simpler phrase works. Do not fill the PR body with CSS class names, prop names, file paths, internal APIs, scroll metrics, or other code-level detail unless a reviewer needs that detail to judge the change. Keep deep technical notes out of the main story; if needed, put them in a short “Implementation notes” subsection at the end.
- Customize context to this PR; do not paste the full issue or reuse a generic blurb.
- Reference relevant Linear issues in the flow of the explanation; use closing language only when the PR actually completes the issue.
- Put useful links beside the statement they support.
- **Visual proof (required for visible changes):** If the change is visible in the product UI—layout, styling, copy on a page, components that render, OG/social images, animations, or anything reviewers can see on a page or preview—you **must** include at least one screenshot or short demo/video of the actual result in the PR description. Prefer before/after when the change is a fix or redesign. Backend-only or non-visible work (API routes, data fetching, config, CI, dependencies, pure logic with no UI) does **not** require visual proof.
- **Cursor Cloud Agents:** Capture screenshots or a short demo of the changed UI and embed them in the PR body (see the walkthrough-artifacts skill). Enable **Allow posting artifacts to GitHub** in the Cloud Agents dashboard so artifacts appear in PRs.
- Mention open questions only when reviewers need to decide something.

### Preview QA

For UI changes, smoke-test the Vercel preview when one is available: open the preview link from the PR, walk through the main flow you changed (e.g. recipe save, import, or the affected route), and spot-check mobile once. Note anything broken or confusing in the PR or review comments.
