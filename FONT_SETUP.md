# Font Setup Guide

## Karla Font Installation

The Parse & Plate app uses the Karla serif font for headings. The font is now properly configured using Next.js font optimization.

### Current Font Setup ✅

**Headings**: Karla (loaded via Next.js font optimization)
**Body Text**: Inter (loaded via Next.js font optimization)

The fonts are automatically loaded and optimized by Next.js, so no additional setup is required.

### Font Configuration

The app uses:

- **Karla** for headings (serif font family)
- **Inter** for body text (sans-serif font family)
- **Line heights**: 1.3 (headings), 1.6 (body)
- **Font weights**: 300, 400, 500, 600, 700

### Files Updated

1. **`src/app/layout.tsx`** - Karla font loading via Next.js
2. **`src/app/globals.css`** - CSS variables for font families
3. **`tailwind.config.ts`** - Tailwind font family configuration

## Current Design Tokens

The app now uses these design tokens:

### Colors

- Primary Blue: `#0072FF`
- Orange: `#FF6F00`
- Yellow: `#FFCC00`
- Tomato Red: `#FF3B3B`
- Fresh Green: `#00B96D`
- Cream Background: `#FDF7F3`
- Text: `#000000` (headings), `#333333` (body)

### Typography

- Serif: Karla (headings)
- Sans-serif: Inter (body text)
- Line heights: 1.3 (headings), 1.6 (body)

### Spacing

- Base: `px-6`, `py-4`, `gap-6`
- Consistent spacing scale throughout the app

## Testing

The fonts should now load properly without any errors. You can test by:

1. Running `npm run dev`
2. Visiting `http://localhost:3000`
3. Checking that headings use Karla and body text uses Inter
