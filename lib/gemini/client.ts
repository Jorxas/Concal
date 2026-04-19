import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_ID = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

/**
 * Modèle Gemini pour l’analyse vision (clé serveur uniquement).
 */
export function getMealAnalysisModel() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GEMINI_API_KEY est manquant. Ajoute-le dans .env.local (Google AI Studio / Cloud).",
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: MODEL_ID,
    generationConfig: {
      temperature: 0.2,
      /** Force une sortie JSON parseable (sans markdown). */
      responseMimeType: "application/json",
    },
  });
}
