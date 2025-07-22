## Getting Started

First, install necessary python packages:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Install node dependencies:

```bash
npm install
```

## Environment Setup

Create a `.env.local` file in the root directory with your Groq API key:

```bash
GROQ_API_KEY=your_groq_api_key_here
```

### Groq API Setup

1. **Get a Groq API Key**: 
   - Sign up at [https://console.groq.com/](https://console.groq.com/)
   - Create an API key in your dashboard

2. **Accept Terms and Conditions**:
   - Some Groq models require terms acceptance
   - If you encounter a "model_terms_required" error, visit the model playground to accept terms
   - For example: [https://console.groq.com/playground?model=mistral-saba-24b](https://console.groq.com/playground?model=mistral-saba-24b)
   - The app uses `llama3-8b-8192` by default, which doesn't require special terms acceptance

Next, start up development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- React
- Next.js
- Tailwindcss
- Python
- Shadcn component library
- Lucide svg icons
- recipe-scrapers (python library)
- Groq AI API (for recipe parsing)

## Infrastructure

- Docker
- AWS ECS/ECR/EC2 (Elastic Container Service & Elastic Container Repository for cloud hosting on EC2 instance)
