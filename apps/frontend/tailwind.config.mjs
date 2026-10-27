/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f1117",
          raised: "#161922",
          overlay: "#1c2030",
          border: "#2a3042",
          hover: "#222838",
        },
        accent: {
          DEFAULT: "#f97316",
          hover: "#ea580c",
          muted: "#fb923c33",
          foreground: "#fff7ed",
        },
        content: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.25)",
        glow: "0 0 20px rgba(249,115,22,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
