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
    heroLine1: "提升沟通效率，减少语言误解",
    heroLine2: "标准化报价流程，提升专业形象",
    heroLine3: "帮助承包商提高成交转化率",
    heroProof: "清晰 · 专业 · 可靠",
    languagesLabel: "多语言支持",
    languagesValue: "中文 · English · Español",
    sectionFeatures: "核心能力",
    sectionStories: "用户原声",
    startBtn: "免费开始使用",
    loginBtn: "已有账号？登录",
    feature1Title: "实时翻译",
    feature1Desc: "您用中文沟通，客户收到地道英文。\n措辞统一，减少现场误解。",
    feature2Title: "规范报价",
    feature2Desc: "结构化模板与明细清单，一次对齐范围、单价与工期。",
    feature3Title: "材料比价",
    feature3Desc: "拍照识别物料，横向比价，采购决策有据可依。",
    feature4Title: "项目统筹",
    feature4Desc: "进度、文档与客户消息集中管理，状态一目了然。",
    testimonialName: "张先生 · 湾区总承包",
    testimonialInitial: "张",
    testimonialQuote: "翻译和报价单都更专业了，客户回复明显更快，谈单更顺。",
    langLabel: "语言",
  },
  en: {
    heroLine1: "Communicate faster—with fewer misunderstandings",
    heroLine2: "Standardize quoting—and elevate your professional image",
    heroLine3: "Help contractors improve close rates",
    heroProof: "Clear · Professional · Reliable",
    languagesLabel: "Languages",
    languagesValue: "中文 · English · Español",
    sectionFeatures: "Capabilities",
    sectionStories: "From contractors",
    startBtn: "Get Started Free",
    loginBtn: "Already have an account?",
    feature1Title: "Live translation",
    feature1Desc: "Speak in Chinese—clients receive polished English.\nConsistent tone, fewer jobsite mix-ups.",
    feature2Title: "Structured quotes",
    feature2Desc: "Templates and line items that align scope, pricing, and schedule in one pass.",
    feature3Title: "Material pricing",
    feature3Desc: "Snap a photo, compare options, and buy with confidence.",
    feature4Title: "Project hub",
    feature4Desc: "Schedules, files, and client messages—organized in one place.",
    testimonialName: "Bay Area GC",
    testimonialInitial: "G",
    testimonialQuote: "Quotes and translations look professional—clients respond faster and deals move.",
    langLabel: "Language",
  },
  es: {
    heroLine1: "Comunicación más fluida—menos malentendidos",
    heroLine2: "Cotizaciones estandarizadas—más imagen profesional",
    heroLine3: "Ayuda a contratistas a cerrar más obras",
    heroProof: "Claro · Profesional · Confiable",
    languagesLabel: "Idiomas",
    languagesValue: "中文 · English · Español",
    sectionFeatures: "Capacidades",
    sectionStories: "Voces de contratistas",
    startBtn: "Comenzar gratis",
    loginBtn: "¿Ya tienes cuenta?",
    feature1Title: "Traducción en vivo",
    feature1Desc: "Habla en tu idioma—el cliente recibe inglés claro.\nMenos confusiones en obra.",
    feature2Title: "Cotizaciones claras",
    feature2Desc: "Plantillas y partidas que alinean alcance, precio y plazos de una vez.",
    feature3Title: "Precios de materiales",
    feature3Desc: "Fotografía, compara y decide con datos.",
    feature4Title: "Centro de proyecto",
    feature4Desc: "Cronograma, archivos y mensajes—todo ordenado.",
    testimonialName: "Contratista · Área de la Bahía",
    testimonialInitial: "C",
    testimonialQuote: "Las cotizaciones y traducciones se ven pro—los clientes responden más rápido.",
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
