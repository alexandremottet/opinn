/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fafaf9",
        ink: "#1c1c1c",
      },
    },
  },
  plugins: [],
};
