import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, anthropicReady } from "@/lib/anthropic";
import { currentUser } from "@/lib/session";
import { guidelinesContext } from "@/data/guidelines";

export const dynamic = "force-dynamic";

const TOOL: Anthropic.Tool = {
  name: "set_design_copy",
  description: "Set the creative headline copy for an on-brand design. Always call this with real, finished copy — never just echo the brief back.",
  input_schema: {
    type: "object",
    properties: {
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
    required: ["titleInk", "titleAccent", "sub"],
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

  const system = `You are a creative copywriter for Strategy's Brand OS design tool. The user gives you a brief or a topic — sometimes just a few words — for a small ad or social graphic. Invent on-brand headline copy for it; never just repeat the brief verbatim as the headline.

Voice: Simple, Bold, Smart — plain language, confident, precise, never arrogant.

Guidelines:
${guidelinesContext(role)}

Call set_design_copy with your finished copy. Keep everything short — this is a headline graphic, not a paragraph.`;

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

    const copy = block.input as { titleInk: string; titleAccent: string; sub: string[] };
    return NextResponse.json({ titleInk: copy.titleInk, titleAccent: copy.titleAccent, sub: copy.sub.join("\n") });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Design copy request failed." }, { status: 502 });
  }
}
