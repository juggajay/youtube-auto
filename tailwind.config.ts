import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-deep)",
        foreground: "var(--text-primary)",
        "bg-deep": "var(--bg-deep)",
        "bg-surface": "var(--bg-surface)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-hover": "var(--bg-hover)",
        
        "border-subtle": "var(--border-subtle)",
        "border-default": "var(--border-default)",
        "border-strong": "var(--border-strong)",

        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",

        "gold-primary": "var(--color-gold-primary)",
        "gold-secondary": "var(--color-gold-secondary)",

        "node-trigger": "var(--node-trigger)",
        "node-script": "var(--node-script)",
        "node-voice": "var(--node-voice)",
        "node-thumbnail": "var(--node-thumbnail)",
        "node-assembly": "var(--node-assembly)",
        "node-publish": "var(--node-publish)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      animation: {
        "spin-slow": "spin 20s linear infinite",
        "flow": "flowDash 1s linear infinite",
      },
      keyframes: {
        flowDash: {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
