import { NextResponse } from "next/server";
import { z } from "zod";
import {
  GEMINI_ANALYZE_FOOD_INSTRUCTIONS_FR,
  GEMINI_ANALYZE_FOOD_USER_FR,
} from "@/lib/ai/analyze-food-prompt";
import { getMealAnalysisModel } from "@/lib/gemini/client";
import { createClient } from "@/lib/supabase/server";
import { analyzeFoodResponseSchema } from "@/lib/validations/analyze-food-response";

/** Taille max. du corps JSON (data URL / base64). */
const MAX_IMAGE_PAYLOAD_CHARS = 11_000_000;

const bodySchema = z.object({
  image: z.string().min(1, "Image manquante."),
});

/** Extrait mime + données base64 brutes depuis une data URL ou du base64 nu. */
function parseInlineImagePayload(image: string): { mimeType: string; data: string } {
  const trimmed = image.trim();
  const dataUrl = /^data:([^;]+);base64,([\s\S]+)$/i.exec(trimmed);
  if (dataUrl) {
    return { mimeType: dataUrl[1], data: dataUrl[2].replace(/\s/g, "") };
  }
  return { mimeType: "image/jpeg", data: trimmed.replace(/\s/g, "") };
}

/** Parse le texte modèle : JSON pur ou bloc markdown de secours. */
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

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsedBody = bodySchema.safeParse(raw);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 },
    );
  }

  const { image } = parsedBody.data;
  if (image.length > MAX_IMAGE_PAYLOAD_CHARS) {
    return NextResponse.json(
      { error: "Image trop volumineuse pour l’analyse." },
      { status: 413 },
    );
  }

  let model: ReturnType<typeof getMealAnalysisModel>;
  try {
    model = getMealAnalysisModel();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Configuration Google Gemini invalide.";
    return NextResponse.json({ error: message }, { status: 500 });
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
      return NextResponse.json(
        { error: "Réponse vide du modèle." },
        { status: 502 },
      );
    }

    let json: unknown;
    try {
      json = parseModelJsonText(text);
    } catch {
      return NextResponse.json(
        { error: "Le modèle n’a pas renvoyé du JSON exploitable." },
        { status: 502 },
      );
    }

    const parsed = analyzeFoodResponseSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Structure JSON inattendue du modèle.",
          details: parsed.error.flatten(),
        },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed.data);
  } catch (e: unknown) {
    const message =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : "Erreur Google Gemini.";
    console.error("[analyze-food]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
