/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:    "var(--color-primary)",
        secondary:  "var(--color-secondary)",
        accent:     "var(--color-accent)",
        background: "var(--color-background)",
        text:       "var(--color-text)",
      },
    },
  },
  plugins: [],
};
