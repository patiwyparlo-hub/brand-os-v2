import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, anthropicReady } from "@/lib/anthropic";
import { currentUser } from "@/lib/session";
import { guidelinesContext } from "@/data/guidelines";

export const dynamic = "force-dynamic";

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
      sub: { type: "string", description: "Supporting copy for the 'statement' layout — up to three lines separated by \\n." },
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
      body: { type: "string", description: "For the 'textimage' layout: the body paragraph." },
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

Call edit_design with only the fields that should change based on the user's latest message. If they ask for new/rewritten copy, write real finished copy yourself — never leave a field as a placeholder or description of what it should say. If their request doesn't map to anything editable, don't call the tool.`;

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

    return NextResponse.json({ patch: block.input, reply: null });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Edit request failed." }, { status: 502 });
  }
}
