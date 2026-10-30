import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Civic teal-navy replaces Tailwind's default indigo/purple (the components use those names).
        indigo: {
          50: "#eff7f9", 100: "#d6eaef", 200: "#acd3de", 300: "#7bb7c8", 400: "#4b96ad",
          500: "#2f7a93", 600: "#1f627c", 700: "#184f65", 800: "#143f51", 900: "#0f3040",
        },
        purple: {
          50: "#f1f7f8", 100: "#dbebee", 200: "#b3d4db", 300: "#86b7c3", 400: "#5a96a6",
          500: "#3e7a8c", 600: "#2d6376", 700: "#244f60", 800: "#1d3f4e", 900: "#162f3b",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
export default config;
