import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette for Parse & Plate
        primary: {
          blue: '#0072FF',
          orange: '#FF6F00',
          yellow: '#FFCC00',
          'tomato-red': '#FF3B3B',
          'fresh-green': '#00B96D',
        },
        background: {
          cream: '#FDF7F3',
        },
        text: {
          heading: '#000000',
          body: '#333333',
        },
      },
      fontFamily: {
        serif: ['var(--font-karla)', 'serif'],
        sans: ['Inter', 'Helvetica', 'system-ui', 'sans-serif'],
      },
      lineHeight: {
        heading: '1.3',
        body: '1.6',
      },
      spacing: {
        // Base spacing scale
        '6': '1.5rem', // 24px
        '4': '1rem', // 16px
      },
    },
  },
  plugins: [],
};

export default config;
