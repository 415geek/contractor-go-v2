import { supabase } from "@/lib/supabase";

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{
    data?: { translated_text?: string };
    error?: string;
  }>("translate", {
    method: "POST",
    body: {
      text,
      source_lang: sourceLang,
      target_lang: targetLang,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error as string);
  return data?.data?.translated_text ?? text;
}

export async function translateVoice(
  _audioUri: string,
  _sourceLang: string,
  _targetLang: string
): Promise<{ transcription: string; translation: string; audioUrl: string }> {
  throw new Error("Voice translation not implemented - requires Whisper + Storage");
}
