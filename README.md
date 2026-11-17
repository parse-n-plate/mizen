# Mizen

One place for every recipe you find online. Clean ingredients, clear steps.

Mizen is sunsetting, and the hosted version at [mizen.recipes](https://www.mizen.recipes/) shuts down at the end of March 2027. The code stays public so you can keep using Mizen by hosting your own copy for personal, noncommercial use. See [License](#license).

## Host your own copy

You need:

- Node.js 20.9 or later
- A [Supabase](https://supabase.com) project (the free plan works)
- A [Groq](https://console.groq.com) API key

### 1. Set up the database

In your Supabase project, open **SQL Editor**, paste in [`supabase/self-host-schema.sql`](supabase/self-host-schema.sql), and run it.

Then open **Authentication → URL Configuration**. Set **Site URL** to where you'll host Mizen (for example `https://recipes.example.com`) and add these redirect URLs:

```
https://recipes.example.com/auth/callback
https://recipes.example.com/auth/confirm
```

Add `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/confirm` too if you'll run it on your computer.

### 2. Add environment variables

Create a `.env.local` file in the project folder:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=your-groq-key
```

| Variable                                           | Required | What it's for                                                                                                                   |
| -------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                         | Yes      | Your Supabase project URL (**Project Settings → API**)                                                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                    | Yes      | Your Supabase anon key (same page)                                                                                              |
| `GROQ_API_KEY`                                     | Yes      | Reads recipes from pages that don't include recipe data, and groups ingredients and titles steps                                |
| `SUPABASE_SERVICE_ROLE_KEY`                        | No       | Checks an email is on your user list before sending a sign-in code, and removes Google sign-ins you didn't add. Keep it secret. |
| `ALLOWED_HOSTS`                                    | No       | Comma-separated hostnames to trust in `x-forwarded-host` when Mizen runs behind a proxy                                         |
| `NOTION_FEEDBACK_API_KEY`, `NOTION_FEEDBACK_DB_ID` | No       | Sends in-app feedback to a Notion database                                                                                      |

### 3. Run it

```bash
npm install
npm run build
npm start
```

Or deploy to [Vercel](https://vercel.com/new) and add the same environment variables there.

### 4. Add people

Mizen doesn't accept new signups, so only people you add can sign in. In Supabase, open **Authentication → Users → Add user** and add their email. They can then sign in from the homepage with an email code.

To let people sign in with Google too, turn on the Google provider under **Authentication → Sign In / Providers**. They still need to be added as a user first.

## Development

```bash
npm run dev        # http://localhost:3000
npm run test:run
npm run lint
npm run typecheck
```

## License

Mizen is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md). You can use, change, and share it for personal or other noncommercial purposes. You can't use it to make money, including charging for a hosted copy, running ads on it, or using it in a business.
