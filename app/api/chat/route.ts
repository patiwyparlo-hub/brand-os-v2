import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, anthropicReady } from "@/lib/anthropic";
import { currentUser } from "@/lib/session";
import { guidelinesContext } from "@/data/guidelines";
import { queryAssets } from "@/data/assets";

export const dynamic = "force-dynamic";

const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_assets",
    description:
      "Look up official Strategy brand asset files (logos, brandmark variants) by name, variant, or use case. Call this whenever the user asks where to find or download a specific brand asset.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for, e.g. 'reversed white logo' or 'mosaic mark'." },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "set_post_content",
    description:
      "Write or update the headline, supporting message, and call-to-action for the social post the user is building. Always call this tool with real, finished copy when the user asks for a post — never just describe the copy in your reply text.",
    input_schema: {
      type: "object",
      properties: {
        headline: { type: "string", description: "Short, bold headline in Strategy's voice: Simple, Bold, Smart." },
        sub: { type: "string", description: "One-sentence supporting message." },
        cta: { type: "string", description: "Short call-to-action." },
      },
      required: ["headline", "sub", "cta"],
      additionalProperties: false,
    },
  },
];

export async function POST(req: NextRequest) {
  if (!anthropicReady()) {
    return NextResponse.json(
      { error: "The assistant isn't configured — add ANTHROPIC_API_KEY to brand-os/.env.local and restart the dev server." },
      { status: 503 }
    );
  }

  const { message, history } = await req.json();
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const user = await currentUser();
  const role = user?.role ?? null;

  const system = `You are the Brand OS assistant for Strategy (formerly MicroStrategy). You do three things: help people find official brand assets, answer questions about the brand guidelines below, and draft on-brand social post copy.

Voice: Simple, Bold, Smart — plain language, confident, precise, never arrogant.

Guidelines:
${guidelinesContext(role)}

Call search_assets when someone asks where to find a file. Call set_post_content with real copy when someone asks for a post. Otherwise answer directly from the guidelines above, and say plainly when something isn't covered rather than guessing.`;

  const priorTurns: Anthropic.MessageParam[] = Array.isArray(history)
    ? history.map((m: { role: "user" | "assistant"; content: string }) => ({ role: m.role, content: m.content }))
    : [];

  const messages: Anthropic.MessageParam[] = [...priorTurns, { role: "user", content: message }];
  const client = anthropic();

  try {
    const turn = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      output_config: { effort: "medium" },
      system,
      tools: TOOLS,
      messages,
    });

    if (turn.stop_reason === "refusal") {
      return NextResponse.json({ reply: "I can't help with that one." });
    }

    if (turn.stop_reason !== "tool_use") {
      const block = turn.content.find((b) => b.type === "text");
      return NextResponse.json({ reply: block?.type === "text" ? block.text : "" });
    }

    let assets: ReturnType<typeof queryAssets> | undefined;
    let post: { headline: string; sub: string; cta: string } | undefined;
    const results: Anthropic.ToolResultBlockParam[] = [];

    for (const block of turn.content) {
      if (block.type !== "tool_use") continue;
      if (block.name === "search_assets") {
        const { query } = block.input as { query: string };
        assets = queryAssets(query, role);
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(assets.map((a) => ({ name: a.name, variant: a.variant, format: a.format, file: a.file }))),
        });
      } else if (block.name === "set_post_content") {
        post = block.input as { headline: string; sub: string; cta: string };
        results.push({ type: "tool_result", tool_use_id: block.id, content: "Post updated." });
      }
    }

    const final = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: { effort: "medium" },
      system,
      tools: TOOLS,
      messages: [...messages, { role: "assistant", content: turn.content }, { role: "user", content: results }],
    });

    const block = final.content.find((b) => b.type === "text");
    return NextResponse.json({ reply: block?.type === "text" ? block.text : "", assets, post });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Assistant request failed." }, { status: 502 });
  }
}
