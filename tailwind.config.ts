import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        turf: {
          50: "#f0fdf0",
          100: "#dbfcdb",
          200: "#b8f7b9",
          300: "#80ee83",
          400: "#42de47",
          500: "#1abf20",
          600: "#10a116",
          700: "#107d14",
          800: "#126316",
          900: "#115115",
          950: "#032d06",
        },
        felt: {
          50: "#f2f7f3",
          100: "#e0ede2",
          200: "#c3dac7",
          300: "#97bfa0",
          400: "#699e75",
          500: "#478158",
          600: "#346845",
          700: "#2a5438",
          800: "#23432e",
          900: "#1d3826",
          950: "#0f1f15",
        },
        sand: {
          50: "#faf8f1",
          100: "#f3eedc",
          200: "#e7dbb6",
          300: "#d7c289",
          400: "#c9a963",
          500: "#be9347",
          600: "#a97a3b",
          700: "#8d5f33",
          800: "#744d2f",
          900: "#60402a",
          950: "#362115",
        },
        slate: {
          850: "#1a2332",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
