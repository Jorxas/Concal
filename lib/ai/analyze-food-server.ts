import {
  GEMINI_ANALYZE_FOOD_INSTRUCTIONS_FR,
  GEMINI_ANALYZE_FOOD_USER_FR,
} from "@/lib/ai/analyze-food-prompt";
import { getMealAnalysisModel } from "@/lib/gemini/client";
import {
  analyzeFoodResponseSchema,
  type AnalyzeFoodResponse,
} from "@/lib/validations/analyze-food-response";

/** Taille max. du corps JSON (data URL / base64), alignée sur l’API route. */
export const MAX_ANALYZE_IMAGE_PAYLOAD_CHARS = 11_000_000;

/** Extrait mime + données base64 brutes depuis une data URL ou du base64 nu. */
export function parseInlineImagePayload(
  image: string,
): { mimeType: string; data: string } {
  const trimmed = image.trim();
  const dataUrl = /^data:([^;]+);base64,([\s\S]+)$/i.exec(trimmed);
  if (dataUrl) {
    return { mimeType: dataUrl[1], data: dataUrl[2].replace(/\s/g, "") };
  }
  return { mimeType: "image/jpeg", data: trimmed.replace(/\s/g, "") };
}

function parseModelJsonText(raw: string): unknown {
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    /* suite */
  }
  const fence = /```(?:json)?\s*([\s\S]*?)```/im.exec(text);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      /* suite */
    }
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(text.slice(start, end + 1));
  }
  throw new SyntaxError("Impossible d’extraire un objet JSON.");
}

export function isGeminiQuotaError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("429") ||
    m.includes("too many requests") ||
    m.includes("quota") ||
    m.includes("resource_exhausted") ||
    m.includes("ratelimit") ||
    m.includes("rate limit")
  );
}

export type AnalyzeFoodServerResult =
  | { ok: true; data: AnalyzeFoodResponse }
  | {
      ok: false;
      error: string;
      code?: "gemini_quota";
    };

/**
 * Analyse une image repas (data URL ou base64) via Gemini — même logique que POST /api/analyze-food.
 */
export async function analyzeFoodFromInlineImage(
  image: string,
): Promise<AnalyzeFoodServerResult> {
  if (!image.trim()) {
    return { ok: false, error: "Image manquante." };
  }
  if (image.length > MAX_ANALYZE_IMAGE_PAYLOAD_CHARS) {
    return { ok: false, error: "Image trop volumineuse pour l’analyse." };
  }

  let model: ReturnType<typeof getMealAnalysisModel>;
  try {
    model = getMealAnalysisModel();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Configuration Google Gemini invalide.";
    return { ok: false, error: message };
  }

  const { mimeType, data } = parseInlineImagePayload(image);

  try {
    const result = await model.generateContent([
      { text: `${GEMINI_ANALYZE_FOOD_INSTRUCTIONS_FR}\n\n${GEMINI_ANALYZE_FOOD_USER_FR}` },
      {
        inlineData: {
          mimeType,
          data,
        },
      },
    ]);

    const text = result.response.text()?.trim();
    if (!text) {
      return { ok: false, error: "Réponse vide du modèle." };
    }

    let json: unknown;
    try {
      json = parseModelJsonText(text);
    } catch {
      return { ok: false, error: "Le modèle n’a pas renvoyé du JSON exploitable." };
    }

    const parsed = analyzeFoodResponseSchema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: "Structure JSON inattendue du modèle." };
    }

    return { ok: true, data: parsed.data };
  } catch (e: unknown) {
    const message =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : "Erreur Google Gemini.";
    if (isGeminiQuotaError(message)) {
      return { ok: false, error: message, code: "gemini_quota" };
    }
    return { ok: false, error: message };
  }
}
