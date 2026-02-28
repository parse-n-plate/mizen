# Environment Variables Setup

## Required Environment Variables

The Parse & Plate app requires the following environment variables to function properly:

### 1. GROQ_API_KEY

This is required for AI-powered recipe parsing when the HTML scraper fails.

**How to get it:**

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key

**Local Development Setup:**

1. Create a `.env.local` file in the root directory:

```bash
touch .env.local
```

2. Add your API key to `.env.local`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

3. Restart the development server:

```bash
npm run dev
```

**Vercel Production Setup:**

1. Go to your Vercel dashboard
2. Select your Parse N' Plate project
3. Navigate to Settings → Environment Variables
4. Add a new variable:
   - Key: `GROQ_API_KEY`
   - Value: (paste your Groq API key)
   - Environment: Select Production, Preview, and Development
5. Click "Save"
6. Redeploy your application for changes to take effect

## Environment File Structure

```
parse-n-plate/
├── .env.local          # Local environment variables (not committed to git)
├── .env.example        # Example environment file (committed to git)
└── ...
```

## Vercel Environment Variables

Vercel manages environment variables separately from your local `.env.local` file:

- **Production**: Used for your main deployment (parse-n-plate.vercel.app)
- **Preview**: Used for pull request previews
- **Development**: Used when running `vercel dev` locally

**Important**: Always add GROQ_API_KEY to all three environments for consistent behavior.

## Testing the Setup

### Local Development:

1. **Without API Key**: Recipe scraping will work, but AI fallback parsing will fail
2. **With API Key**: Full functionality including AI-powered fallback parsing

### Vercel Production:

1. Check deployment logs in Vercel dashboard for any environment variable errors
2. Test a recipe URL to verify API key is working
3. Check function logs if errors occur

## Troubleshooting

### Local Development:

**Error: "GROQ_API_KEY environment variable is missing"**

- Make sure you have created `.env.local` file
- Ensure the API key is correctly formatted
- Restart the development server after adding the environment variable

**Error: "API error: 500"**

- Check that your GROQ_API_KEY is valid
- Verify you have sufficient credits in your Groq account
- Check the server logs for more detailed error messages

### Vercel Production:

**Environment variable not working:**

- Verify the variable is set in Vercel dashboard (Settings → Environment Variables)
- Check that it's enabled for the correct environment (Production/Preview/Development)
- Redeploy after adding or changing environment variables
- Check deployment logs for any errors

**Function timeout or errors:**

- Check Vercel function logs in the dashboard
- Verify your Groq API key is valid and has credits
- Monitor function execution time (10s limit on free tier, 60s on Pro)

## Security Notes

### Local Development:

- Never commit `.env.local` to version control
- The `.env.local` file is already in `.gitignore`
- Keep your API keys secure and don't share them publicly

### Vercel Production:

- Environment variables in Vercel are encrypted at rest
- Only team members with appropriate permissions can view them
- Rotate API keys periodically for security
- Use different API keys for development and production if possible
