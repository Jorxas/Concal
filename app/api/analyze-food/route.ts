import { NextResponse } from "next/server";
import { z } from "zod";
import {
  analyzeFoodFromInlineImage,
  MAX_ANALYZE_IMAGE_PAYLOAD_CHARS,
} from "@/lib/ai/analyze-food-server";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  image: z.string().min(1, "Image manquante."),
});

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
  if (image.length > MAX_ANALYZE_IMAGE_PAYLOAD_CHARS) {
    return NextResponse.json(
      { error: "Image trop volumineuse pour l’analyse." },
      { status: 413 },
    );
  }

  const result = await analyzeFoodFromInlineImage(image);
  if (!result.ok) {
    if (result.code === "gemini_quota") {
      return NextResponse.json({ code: "gemini_quota" as const }, { status: 429 });
    }
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result.data);
}
