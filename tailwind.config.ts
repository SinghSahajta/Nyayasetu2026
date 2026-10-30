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
        // Palette from screenshots/S1 theme.png: deep portal teal + mustard accent. The components use the
        // indigo/purple/amber names, so remapping the scales here recolours the whole site.
        indigo: {
          50: "#eaf6f8", 100: "#cfe9ee", 200: "#9fd3dc", 300: "#6bb7c4", 400: "#3a97a8",
          500: "#1a7d90", 600: "#0e6577", 700: "#0b5262", 800: "#094352", 900: "#07343f",
        },
        purple: {
          50: "#e8f3f5", 100: "#c9e2e8", 200: "#94c4d0", 300: "#5ea4b4", 400: "#2f8497",
          500: "#136b7e", 600: "#0b5668", 700: "#094656", 800: "#073947", 900: "#052c37",
        },
        amber: {
          50: "#fdf8e4", 100: "#faefba", 200: "#f5df83", 300: "#eecb4b", 400: "#e6bb26",
          500: "#dfae12", 600: "#c1940c", 700: "#977109", 800: "#745709", 900: "#5a4509",
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
