import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

export function anthropicReady(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function anthropic(): Anthropic {
  if (!anthropicReady()) {
    throw new Error("ANTHROPIC_API_KEY is not set — add it to brand-os/.env.local and restart the dev server.");
  }
  if (!cached) cached = new Anthropic();
  return cached;
}
