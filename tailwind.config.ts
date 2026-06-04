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
        aptixora: {
          50: '#f5f5f4',
          100: '#e8e7e5',
          200: '#d1cfcb',
          300: '#b2afa8',
          400: '#938f86',
          500: '#7d796f',
          600: '#656158',
          700: '#514e47',
          800: '#43413b',
          900: '#3a3833',
          950: '#1c1b18',
        },
      },
    },
  },
  plugins: [],
};

export default config;
