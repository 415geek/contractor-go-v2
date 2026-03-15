import { useCallback, useEffect, useRef, useState } from "react";

import { translateText } from "@/lib/api/translate";

type Options = {
  text: string;
  sourceLang: string;
  targetLang: string;
  debounceMs?: number;
};

export function useRealtimeTranslation({
  text,
  sourceLang,
  targetLang,
  debounceMs = 300,
}: Options) {
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cache = useRef<Map<string, string>>(new Map());
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!text.trim()) {
      setTranslatedText("");
      setError(null);
      return;
    }

    const cacheKey = `${text}|${sourceLang}|${targetLang}`;
    const cached = cache.current.get(cacheKey);
    if (cached !== undefined) {
      setTranslatedText(cached);
      return;
    }

    timer.current = setTimeout(async () => {
      setIsTranslating(true);
      setError(null);
      try {
        const result = await translateText(text, sourceLang, targetLang);
        cache.current.set(cacheKey, result);
        setTranslatedText(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        setTranslatedText("");
      } finally {
        setIsTranslating(false);
      }
    }, debounceMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text, sourceLang, targetLang, debounceMs]);

  return { translatedText, isTranslating, error };
}
