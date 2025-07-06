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

## Infrastructure

- Docker
- AWS ECS/ECR/EC2 (Elastic Container Service & Elastic Container Repository for cloud hosting on EC2 instance)
