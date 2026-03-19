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
        // 主色：建筑蓝 — 专业、可靠、天空
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
          800: "#1E3A8A",
          900: "#172554",
        },
        // 辅助色：工地橙 — 能量、安全、活力
        accent: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
        },
        // 成功色：完工绿
        success: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
        },
        // 警告色：注意黄
        warning: {
          50: "#FEFCE8",
          100: "#FEF9C3",
          200: "#FEF08A",
          500: "#EAB308",
          600: "#CA8A04",
        },
        // 错误色：警示红
        error: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          500: "#EF4444",
          600: "#DC2626",
        },
        // 表面层级 (深色模式，工地强光下更易读)
        surface: {
          app: "#0F172A",
          card: "#1E293B",
          elevated: "#334155",
          border: "#475569",
          borderMuted: "#334155",
        },
        // 品牌色 (向后兼容)
        brand: {
          100: "#DBEAFE",
          500: "#2563EB",
        },
        // 改进文字对比度
        slate: {
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
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
        "card": "0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)",
        "card-lg": "0 4px 16px rgba(0, 0, 0, 0.16), 0 2px 4px rgba(0, 0, 0, 0.12)",
        "elevated": "0 8px 32px rgba(0, 0, 0, 0.24), 0 4px 8px rgba(0, 0, 0, 0.12)",
        "button": "0 2px 8px rgba(37, 99, 235, 0.3)",
        "button-lg": "0 4px 16px rgba(37, 99, 235, 0.4)",
        "inner-light": "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
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
