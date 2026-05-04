/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      colors: {
        ink: "var(--ink)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        sand: "var(--bg)",
        panel: "var(--panel)",
        stroke: "var(--stroke)",
      },
      boxShadow: {
        soft: "0 24px 60px -40px rgba(15, 23, 42, 0.45)",
      },
    },
  },
  plugins: [],
};
