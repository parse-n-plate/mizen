# Mizen

A Next.js application that parses recipes from URLs or images and extracts ingredients and instructions using structured data extraction and AI processing.

## Features

- **Recipe Parsing**: Extract recipes from any cooking website URL or uploaded images
- **Ingredient Scaling**: Adjust servings and multipliers with automatic calculations
- **Step-by-Step View**: Interactive cooking instructions with list and card modes
- **Built-in Timers**: Timer functionality for recipe steps
- **Recent Recipes**: Track your recently parsed recipes
- **Cuisine Filtering**: Filter recipes by cuisine type

## Getting Started

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- npm or yarn
- Groq API key

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

3. Get a Groq API key:
   - Sign up at [https://console.groq.com/](https://console.groq.com/)
   - Create an API key in your dashboard
   - If you encounter a "model_terms_required" error, visit the model playground to accept terms

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Node.js Version

This project uses [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions:

```bash
nvm install  # installs the version in .nvmrc
nvm use      # switches to the correct version
```

## Tech Stack

- **Frontend**: React 19, Next.js 15, TypeScript
- **Styling**: Tailwind CSS 4, Shadcn/ui
- **Backend**: Next.js API Routes
- **AI/ML**: Groq AI API (llama-3.3-70b-versatile)
- **Parsing**: Cheerio, JSON-LD extraction with AI fallback

## Documentation

For detailed technical information, see [TECHNICAL_SUMMARY.md](./TECHNICAL_SUMMARY.md).
