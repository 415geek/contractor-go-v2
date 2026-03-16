/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#3B82F6",
        },
        surface: {
          app: "#0F172A",
          card: "#1E293B",
          elevated: "#334155",
          border: "#475569",
        },
        primary: {
          500: "#3B82F6",
          600: "#2563EB",
        },
      },
      borderRadius: {
        "auth-input": "14px",
        "auth-button": "14px",
        "auth-card": "20px",
      },
      minHeight: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};
