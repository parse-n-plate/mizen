# Changelog

All notable changes to Parse N' Plate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **MAJOR INFRASTRUCTURE MIGRATION**: Migrated from AWS (ECS/ECR/EC2) to Vercel serverless hosting
- **Recipe scraper**: Converted from Python to Node.js for Vercel compatibility
- **Deployment**: Changed from Docker containers to serverless functions
- **CI/CD**: Simplified GitHub Actions to linting only (Vercel handles deployments)
- **Cost savings**: Reduced hosting costs from ~$15-30/month to $0/month (free tier)
- **Performance**: Improved global performance with Vercel's edge network and CDN

### Added

- Node.js recipe scraper using Cheerio and Axios (`src/utils/scrape_recipe.ts`)
- Multi-layer parsing approach: JSON-LD structured data + comprehensive HTML selectors
- Vercel deployment configuration and environment variable documentation
- Automatic deployments via Git push (handled by Vercel)
- Global CDN and edge functions for faster response times
- Changelog file to track project changes
- Cursor rules for maintaining changelog

### Removed

- Python dependencies (recipe-scrapers, beautifulsoup4, requests)
- Docker containerization (no longer needed for Vercel)
- AWS deployment workflow from GitHub Actions
- Python-based web scraping (`src/utils/scrape_recipe.py`)
- requirements.txt file

### Technical Details

- **Old Stack**: Docker → AWS ECR → ECS → EC2 (with Nginx)
- **New Stack**: Git push → Vercel → Serverless Functions (global edge network)
- **Scraper Migration**: Python (spawn process) → Node.js (native function call)
- **Deployment Time**: Reduced from ~5-10 minutes to <1 minute
- **Infrastructure**: Zero server maintenance required

## [0.1.0] - 2025-11-16

### Added

- Initial release of Parse N' Plate recipe parser
- Recipe URL parsing with Python backend (recipe-scrapers)
- AI-powered ingredient and instruction parsing with Groq API
- Recent recipes list with localStorage persistence
- Modern UI with Tailwind CSS and shadcn/ui components
- Recipe Context for state management
- Error handling and user-friendly error displays
- Navbar with search functionality
- Loading states and skeleton screens
- Docker support for containerized deployment

### Technical Features

- Next.js 15.3.4 with React 19
- TypeScript for type safety
- Python integration for web scraping
- Cheerio for HTML parsing fallback
- OpenAI and Groq SDK integration
- Responsive design with mobile support

---

## How to Use This Changelog

### Categories

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Features that will be removed in future versions
- **Removed** - Features that have been removed
- **Fixed** - Bug fixes
- **Security** - Security updates

### Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **Major** version (X.0.0) - Incompatible API changes
- **Minor** version (0.X.0) - New functionality (backwards compatible)
- **Patch** version (0.0.X) - Bug fixes (backwards compatible)

### When to Update

Update the changelog when you make:

- New features or components
- Breaking changes to existing functionality
- Bug fixes
- Dependency updates (major versions)
- Configuration changes
- API changes
- UI/UX improvements
- Performance optimizations

[Unreleased]: https://github.com/yourusername/parse-n-plate/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/parse-n-plate/releases/tag/v0.1.0
