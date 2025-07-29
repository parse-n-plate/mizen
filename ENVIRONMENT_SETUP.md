# Environment Variables Setup

## Required Environment Variables

The Parse & Plate app requires the following environment variables to function properly:

### 1. GROQ_API_KEY

This is required for AI-powered recipe parsing when the Python scraper fails.

**How to get it:**

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key

**Setup:**

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

## Environment File Structure

```
parse-n-plate/
├── .env.local          # Local environment variables (not committed to git)
├── .env.example        # Example environment file (committed to git)
└── ...
```

## Testing the Setup

1. **Without API Key**: The app will work for basic recipe scraping but will fail when AI parsing is needed
2. **With API Key**: The app will work for both basic scraping and AI-powered parsing

## Troubleshooting

### Error: "GROQ_API_KEY environment variable is missing"

- Make sure you have created `.env.local` file
- Ensure the API key is correctly formatted
- Restart the development server after adding the environment variable

### Error: "API error: 500"

- Check that your GROQ_API_KEY is valid
- Verify you have sufficient credits in your Groq account
- Check the server logs for more detailed error messages

## Security Notes

- Never commit `.env.local` to version control
- The `.env.local` file is already in `.gitignore`
- Keep your API keys secure and don't share them publicly
