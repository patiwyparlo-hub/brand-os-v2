import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, anthropicReady } from "@/lib/anthropic";
import { currentUser } from "@/lib/session";
import { guidelinesContext } from "@/data/guidelines";
import { generateImage, higgsfieldReady } from "@/lib/higgsfield";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TOOL: Anthropic.Tool = {
  name: "set_design_copy",
  description: "Set the creative headline copy and layout choices for an on-brand design. Always call this with real, finished copy — never just echo the brief back.",
  input_schema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["square", "landscape", "wide", "story", "document"],
        description:
          "Best output format for where this will be used. square: Instagram/general social. landscape: Facebook or LinkedIn feed post. wide: slides/presentations. story: Reels, TikTok, Stories (vertical). document: reports or PDFs. Infer this from any platform the brief mentions; default to square if nothing suggests otherwise.",
      },
      layout: {
        type: "string",
        enum: ["statement", "keystats", "benefits", "cardgrid", "textimage"],
        description:
          "Which content block the design shows below the headline. statement: short supporting copy only. keystats: a few big numbers. benefits: a checklist. cardgrid: a grid of value/label cards. textimage: supporting copy alongside a real photo — choose this whenever the brief asks for, describes, or implies an actual photo/image (e.g. 'with a photo of...', 'zdjęcie...'). Default to statement if nothing suggests otherwise.",
      },
      imagePrompt: {
        type: "string",
        description:
          "Only set this when layout is 'textimage': a vivid, concrete image-generation prompt (in English, photographic style) describing exactly the photo the brief wants. Omit entirely for any other layout.",
      },
      titleInk: {
        type: "string",
        description: "Short plain lead-in line, shown above the accent line in the page's normal ink color. Can be an empty string if the accent line should stand alone.",
      },
      titleAccent: {
        type: "string",
        description: "The bold, punchy headline phrase — the most attention-grabbing part of the design, shown in the brand's signature accent color.",
      },
      sub: {
        type: "array",
        description: "Exactly three short supporting lines that elaborate on the message. Each line should be brief enough to read at a glance.",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
      },
    },
    required: ["format", "layout", "titleInk", "titleAccent", "sub"],
    additionalProperties: false,
  },
};

export async function POST(req: NextRequest) {
  if (!anthropicReady()) {
    return NextResponse.json(
      { error: "The assistant isn't configured — add ANTHROPIC_API_KEY to brand-os/.env.local and restart the dev server." },
      { status: 503 }
    );
  }

  const { brief } = await req.json();
  if (!brief || typeof brief !== "string" || !brief.trim()) {
    return NextResponse.json({ error: "Brief is required." }, { status: 400 });
  }

  const user = await currentUser();
  const role = user?.role ?? null;

  const system = `You are a creative copywriter and art director for Strategy's Brand OS design tool. The user gives you a brief or a topic — sometimes just a few words — for a small ad or social graphic. Invent on-brand headline copy for it; never just repeat the brief verbatim as the headline. You also choose the format and layout that best fit the brief, so the user doesn't have to configure anything manually.

Voice: Simple, Bold, Smart — plain language, confident, precise, never arrogant.

Guidelines:
${guidelinesContext(role)}

Call set_design_copy with your finished copy plus your chosen format and layout. Keep everything short — this is a headline graphic, not a paragraph.`;

  const client = anthropic();

  try {
    const turn = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: { effort: "medium" },
      system,
      tools: [TOOL],
      tool_choice: { type: "tool", name: "set_design_copy" },
      messages: [{ role: "user", content: brief }],
    });

    const block = turn.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      return NextResponse.json({ error: "The assistant didn't return design copy." }, { status: 502 });
    }

    const copy = block.input as {
      format: "square" | "landscape" | "wide" | "story" | "document";
      layout: "statement" | "keystats" | "benefits" | "cardgrid" | "textimage";
      imagePrompt?: string;
      titleInk: string;
      titleAccent: string;
      sub: string[];
    };

    let imageUrl: string | undefined;
    if (copy.layout === "textimage" && copy.imagePrompt && higgsfieldReady()) {
      try {
        imageUrl = await generateImage(copy.imagePrompt);
      } catch (err) {
        console.error("Higgsfield image generation failed:", err);
        // Fall back to the textimage layout without a photo rather than failing the whole request.
      }
    } else if (copy.layout === "textimage") {
      console.warn("textimage layout chosen but no image generated", {
        hasPrompt: Boolean(copy.imagePrompt),
        higgsfieldReady: higgsfieldReady(),
      });
    }

    return NextResponse.json({
      format: copy.format,
      layout: copy.layout,
      titleInk: copy.titleInk,
      titleAccent: copy.titleAccent,
      sub: copy.sub.join("\n"),
      imageUrl,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Design copy request failed." }, { status: 502 });
  }
}
