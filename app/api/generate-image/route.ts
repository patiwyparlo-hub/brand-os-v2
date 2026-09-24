import { NextRequest, NextResponse } from "next/server";
import { generateImage, higgsfieldReady } from "@/lib/higgsfield";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!higgsfieldReady()) {
    return NextResponse.json(
      { error: "Image generation isn't configured — add HIGGSFIELD_API_KEY to .env.local and restart the dev server." },
      { status: 503 }
    );
  }

  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  try {
    const imageUrl = await generateImage(prompt.trim());
    return NextResponse.json({ imageUrl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Image generation failed." }, { status: 502 });
  }
}
