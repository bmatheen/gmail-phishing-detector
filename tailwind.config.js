/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,html}", "./popup.html"],
  theme: {
    extend: {
      colors: {
        safe: "#16a34a",
        suspicious: "#d97706",
        phishing: "#dc2626",
      },
    },
  },
  plugins: [],
};
