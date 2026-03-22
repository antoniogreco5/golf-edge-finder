import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          root: '#0a0f14',
          card: '#0f1419',
          elevated: '#151c24',
          hover: '#1a222c',
          input: '#111820',
        },
        edge: {
          strong: '#34d399',
          playable: '#fbbf24',
          monitor: '#64748b',
          negative: '#f87171',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'serif'],
        body: ['Source Sans 3', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
};

export default config;
