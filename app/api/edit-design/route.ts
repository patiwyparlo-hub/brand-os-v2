import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, anthropicReady } from "@/lib/anthropic";
import { currentUser } from "@/lib/session";
import { guidelinesContext } from "@/data/guidelines";
import { generateImage, higgsfieldReady } from "@/lib/higgsfield";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TOOL: Anthropic.Tool = {
  name: "edit_design",
  description:
    "Apply the user's requested change to the design. Only include the fields that should actually change — leave every other field out of the call entirely.",
  input_schema: {
    type: "object",
    properties: {
      theme: { type: "string", enum: ["white", "dark", "orange"], description: "Canvas background theme." },
      layout: {
        type: "string",
        enum: ["statement", "keystats", "benefits", "cardgrid", "textimage"],
        description: "Which content block the layout shows below the headline.",
      },
      titleInk: { type: "string", description: "Plain lead-in line of the headline (page's normal ink color)." },
      titleAccent: { type: "string", description: "Bold accent line of the headline (brand accent color)." },
      sub: {
        type: "array",
        description: "Supporting copy for the 'statement' and 'textimage' layouts — exactly three short lines.",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
      },
      cta: { type: "string", description: "Call-to-action button text." },
      stats: {
        type: "array",
        description: "For the 'keystats' layout: an array of {v, l} value/label pairs, e.g. {v: '98%', l: 'Customer satisfaction'}.",
        items: {
          type: "object",
          properties: { v: { type: "string" }, l: { type: "string" } },
          required: ["v", "l"],
          additionalProperties: false,
        },
      },
      benefits: {
        type: "array",
        description: "For the 'benefits' layout: an array of short benefit strings.",
        items: { type: "string" },
      },
      cards: {
        type: "array",
        description: "For the 'cardgrid' layout: an array of {v, l} value/label pairs.",
        items: {
          type: "object",
          properties: { v: { type: "string" }, l: { type: "string" } },
          required: ["v", "l"],
          additionalProperties: false,
        },
      },
      imagePrompt: {
        type: "string",
        description:
          "Only set this when the user asks to add, change, or replace the photo (e.g. 'add a photo of...', 'dodaj zdjęcie...'): a vivid, concrete image-generation prompt (in English, photographic style) describing exactly what they asked for. When you set this, also set layout to 'textimage' unless it already is. Omit entirely otherwise.",
      },
    },
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

  const { message, design, history } = await req.json();
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (!design || typeof design !== "object") {
    return NextResponse.json({ error: "Current design state is required." }, { status: 400 });
  }

  const user = await currentUser();
  const role = user?.role ?? null;

  const system = `You are the design-editing assistant inside Strategy's Brand OS. The user is looking at one design (a small ad/social graphic) and asks you to change something about it — copy, theme, or layout.

Voice: Simple, Bold, Smart — plain language, confident, precise, never arrogant.

Guidelines:
${guidelinesContext(role)}

Current design state (JSON):
${JSON.stringify(design, null, 2)}

Call edit_design with only the fields that should change based on the user's latest message. If they ask for new/rewritten copy, write real finished copy yourself — never leave a field as a placeholder or description of what it should say. If they ask to add, change, or replace a photo, set imagePrompt (and layout: "textimage" if it isn't already). If their request doesn't map to anything editable, don't call the tool.`;

  const priorTurns: Anthropic.MessageParam[] = Array.isArray(history)
    ? history.map((m: { role: "user" | "assistant"; content: string }) => ({ role: m.role, content: m.content }))
    : [];

  const messages: Anthropic.MessageParam[] = [...priorTurns, { role: "user", content: message }];
  const client = anthropic();

  try {
    const turn = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: { effort: "medium" },
      system,
      tools: [TOOL],
      messages,
    });

    if (turn.stop_reason === "refusal") {
      return NextResponse.json({ patch: null, reply: "I can't help with that one." });
    }

    const block = turn.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      const textBlock = turn.content.find((b) => b.type === "text");
      return NextResponse.json({ patch: null, reply: textBlock?.type === "text" ? textBlock.text : "Not sure what to change — try being more specific." });
    }

    const patch = block.input as Record<string, unknown>;
    if (Array.isArray(patch.sub)) patch.sub = (patch.sub as string[]).join("\n");

    const imagePrompt = typeof patch.imagePrompt === "string" ? patch.imagePrompt : null;
    delete patch.imagePrompt;
    if (imagePrompt && higgsfieldReady()) {
      try {
        patch.imageUrl = await generateImage(imagePrompt);
      } catch (err) {
        console.error("Higgsfield image generation failed:", err);
        return NextResponse.json({ patch, reply: "Couldn't generate that photo right now — applied everything else." });
      }
    } else if (imagePrompt) {
      return NextResponse.json({ patch, reply: "Image generation isn't configured — applied everything else." });
    }

    return NextResponse.json({ patch, reply: null });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Edit request failed." }, { status: 502 });
  }
}
