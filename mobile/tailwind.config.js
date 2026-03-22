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
        // 主 CTA：青绿 / 青蓝（物业信息「浏览器打开」等）
        primary: {
          50: "#e0f9fc",
          100: "#b3eef5",
          200: "#80e2ed",
          300: "#4dd5e5",
          400: "#26c4d9",
          500: "#00a3bf",
          600: "#008fa8",
          700: "#007a90",
          800: "#005f70",
          900: "#004050",
        },
        // 电蓝：Tab 选中、中间首页、次级强调
        electric: {
          400: "#38b5ff",
          500: "#1e90ff",
          600: "#1877cc",
          700: "#125ea3",
        },
        // 辅助色：工地橙
        accent: {
          50: "#2a1f15",
          100: "#3d2a18",
          200: "#5c3d22",
          300: "#7a4f2a",
          400: "#f97316",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
        success: {
          50: "#0d2818",
          100: "#14532d",
          200: "#166534",
          500: "#30d158",
          600: "#22c55e",
          700: "#15803d",
        },
        warning: {
          50: "#2a2108",
          100: "#422006",
          200: "#713f12",
          500: "#ff9f0a",
          600: "#e6a800",
        },
        error: {
          50: "#2a0f0f",
          100: "#450a0a",
          200: "#7f1d1d",
          500: "#ff453a",
          600: "#ef4444",
        },
        // 表面：深色海军 + 卡片（对齐物业信息）
        surface: {
          app: "#0a0e17",
          appDeep: "#050a1b",
          card: "#1c2237",
          elevated: "#252d42",
          highlight: "#2d364d",
          border: "#2d364d",
          borderMuted: "#1e293b",
        },
        ink: {
          DEFAULT: "#ffffff",
          secondary: "#8e9aaf",
          tertiary: "#64748b",
        },
        brand: {
          100: "#0d3d47",
          500: "#00a3bf",
        },
        slate: {
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#050a1b",
        },
      },
      borderRadius: {
        "auth-input": "14px",
        "auth-button": "14px",
        "auth-card": "20px",
        "tool-card": "16px",
        "project-card": "12px",
        badge: "8px",
        "chat-bubble": "20px",
        "2xl": "16px",
        "3xl": "24px",
      },
      minHeight: {
        touch: "44px",
        "touch-lg": "48px",
        "touch-xl": "56px",
      },
      minWidth: {
        touch: "44px",
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
      },
      spacing: {
        18: "72px",
        22: "88px",
        26: "104px",
        30: "120px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)",
        "card-lg": "0 8px 24px rgba(0, 0, 0, 0.45)",
        elevated: "0 12px 40px rgba(0, 0, 0, 0.5)",
        button: "0 4px 18px rgba(0, 163, 191, 0.4)",
        "button-lg": "0 6px 22px rgba(30, 144, 255, 0.45)",
        "inner-light": "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      borderWidth: {
        "0.5": "0.5px",
      },
    },
  },
  plugins: [],
};
