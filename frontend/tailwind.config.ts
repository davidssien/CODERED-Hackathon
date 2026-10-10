import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 24px 80px rgba(10, 18, 28, 0.18)",
      },
      animation: {
        "soft-pulse": "softPulse 1.7s ease-in-out infinite",
      },
      keyframes: {
        softPulse: {
          "0%, 100%": { opacity: "0.42" },
          "50%": { opacity: "0.9" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
