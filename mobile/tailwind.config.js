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
        // 主色：iOS 系统蓝（Proma / Uber 级主操作色）
        primary: {
          50: "#E8F1FF",
          100: "#C7E0FF",
          200: "#A3CFFF",
          300: "#7AB8FF",
          400: "#4DA3FF",
          500: "#007AFF",
          600: "#0062CC",
          700: "#004C99",
          800: "#003D7A",
          900: "#002952",
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
        // 表面：浅色优先（Apple 系统灰 + 白卡）
        surface: {
          app: "#F5F5F7",
          card: "#FFFFFF",
          elevated: "#FAFAFA",
          border: "#E5E5EA",
          borderMuted: "#D1D1D6",
        },
        ink: {
          DEFAULT: "#1C1C1E",
          secondary: "#636366",
          tertiary: "#8E8E93",
        },
        // 品牌色 (向后兼容)
        brand: {
          100: "#E8F1FF",
          500: "#007AFF",
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
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "card-lg": "0 4px 14px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
        elevated: "0 8px 24px rgba(0, 0, 0, 0.1)",
        button: "0 4px 14px rgba(0, 122, 255, 0.28)",
        "button-lg": "0 6px 20px rgba(0, 122, 255, 0.32)",
        "inner-light": "inset 0 1px 0 rgba(255, 255, 255, 0.8)",
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
