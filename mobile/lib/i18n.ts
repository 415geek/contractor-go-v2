/**
 * Contractor GO v2 — i18n (多语言)
 * 支持：中文(zh) / English(en) / Español(es)
 * 默认：中文
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type Lang = "zh" | "en" | "es";

const STORAGE_KEY = "cgo_lang";

// ─── 翻译内容 ────────────────────────────────────────────────────────────────

export const translations = {
  zh: {
    // 落地页
    tagline: "包工头的智能助手",
    subtitle: "专为华人、南美洲包工头打造\n沟通无障碍，接单更简单",
    startBtn: "免费开始使用",
    loginBtn: "已有账号，登录",
    feature1Title: "沟通无障碍",
    feature1Desc: "和客户说中文，他们收到英文\nAI实时翻译，沟通零障碍",
    feature2Title: "专业报价单",
    feature2Desc: "一键生成专业报价单\n让客户看到您的专业",
    feature3Title: "拍照比价",
    feature3Desc: "扫描材料，全网比价\n找到最便宜的材料",
    feature4Title: "项目管理",
    feature4Desc: "AI生成施工方案\n进度一目了然",
    promoTitle: "5,000+ 包工头的选择",
    promoSub: "已帮助包工头节省 $2M+ 材料费",
    langLabel: "语言",
  },
  en: {
    tagline: "The Smart Assistant for Contractors",
    subtitle: "Built for Chinese & Latino contractors\nBreak language barriers, win more jobs",
    startBtn: "Get Started Free",
    loginBtn: "Already have an account? Login",
    feature1Title: "No Language Barrier",
    feature1Desc: "Chat in Chinese, client gets English\nAI real-time translation",
    feature2Title: "Professional Quotes",
    feature2Desc: "Generate professional estimates\nImpress your clients",
    feature3Title: "Material Price Scan",
    feature3Desc: "Scan materials, compare prices\nFind the best deals",
    feature4Title: "Project Management",
    feature4Desc: "AI-generated work plans\nTrack progress at a glance",
    promoTitle: "5,000+ Contractors Trust Us",
    promoSub: "Saved contractors $2M+ in material costs",
    langLabel: "Language",
  },
  es: {
    tagline: "El Asistente Inteligente para Contratistas",
    subtitle: "Diseñado para contratistas latinos y chinos\nRompe barreras idiomáticas",
    startBtn: "Comenzar Gratis",
    loginBtn: "Ya tengo cuenta, Iniciar sesión",
    feature1Title: "Sin Barreras",
    feature1Desc: "Habla español, tu cliente recibe inglés\nTraducción en tiempo real",
    feature2Title: "Cotizaciones Pro",
    feature2Desc: "Genera cotizaciones profesionales\nImpresiona a tus clientes",
    feature3Title: "Comparar Precios",
    feature3Desc: "Fotografía materiales, compara precios\nEncuentra las mejores ofertas",
    feature4Title: "Gestión de Proyectos",
    feature4Desc: "Planes generados por IA\nSeguimiento de progreso",
    promoTitle: "5,000+ Contratistas Confían en Nosotros",
    promoSub: "Ahorramos $2M+ en costos de materiales",
    langLabel: "Idioma",
  },
} as const;

// ─── Zustand Store ────────────────────────────────────────────────────────────

type LangState = {
  lang: Lang;
  t: (typeof translations)["zh"];
  setLang: (lang: Lang) => void;
  loadLang: () => Promise<void>;
};

export const useLang = create<LangState>((set) => ({
  lang: "zh",
  t: translations["zh"],
  setLang: async (lang: Lang) => {
    set({ lang, t: translations[lang] });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  },
  loadLang: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && saved in translations) {
        const lang = saved as Lang;
        set({ lang, t: translations[lang] });
      }
    } catch {}
  },
}));

export const LANG_OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇲🇽" },
];
