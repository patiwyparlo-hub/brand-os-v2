import type { GuidelineEntry } from "@/lib/types";

export const GUIDELINES: GuidelineEntry[] = [
  {
    id: "company",
    section: "Introduction",
    title: "Company description",
    access: "internal",
    body: "Strategy is the world's first and largest Bitcoin Treasury Company, and the largest independent, publicly traded business intelligence company. We provide cloud-native, AI-powered enterprise analytics software to thousands of global customers, and leverage 35 years of software expertise to explore innovation in Bitcoin applications.",
  },
  {
    id: "values",
    section: "Values",
    title: "Core values",
    access: "public",
    body: "Bold — we act thoughtfully, move quickly. Agile — we work together to win. Engaged — we focus on the outcome. Impactful — we show up passionately committed. United — we are courageous and innovative.",
  },
  {
    id: "principles",
    section: "Introduction",
    title: "Design principles & signature color",
    access: "public",
    body: "Clean, Distinct, Adaptive, Optimistic. Our signature color is orange — the color of energy, a life-giving force. \"Orange is a neutral, egalitarian, empowering color... it reminds you of the sun.\" — Michael Saylor.",
  },
  {
    id: "brandmark",
    section: "Brandmark",
    title: "Brandmark & symbol rules",
    access: "public",
    body: "We say 'brandmark', not 'logo' — it carries the visual and emotional associations of the brand. The black brandmark is primary; it must never be altered and never appear without the ₿ symbol. The ₿ symbol is a proprietary design (call it 'the Strategy symbol', never 'the Bitcoin B'). Variants: Primary (black), Reversed (white), Orange.",
  },
  {
    id: "safe-zones",
    section: "Brandmark",
    title: "Safe zones & placement",
    access: "public",
    body: "Brandmark safe zone = 1× the ₿ symbol's height; keep it free of any other graphics or text. 16:9 formats: default top-left, size 1/3 width. 'A' formats: top-left or bottom-right, 1/2 width. Narrow/screen formats: top/centre/bottom-centre, 1/2 width. Wide formats: left/centre/right, 1/4 width.",
  },
  {
    id: "color",
    section: "Color",
    title: "Primary & secondary colors",
    access: "public",
    body: "Primary: Black #000000, White #FFFFFF, Signature Orange #FA660F (Pantone 1505C). Secondary neutrals: #F2F2F2, #E4E4E4, #D2D2D2, #A8A8A8, #717171, #484747. Muted accents: #B7CCD3, #CEC8B7, #D1C3C6, #C4BFCA, #D1B4A3, #BEC3BE. Gradients: Orange (#FA660F→#FFFFFF), Dark (#000000→#A8A8A8).",
  },
  {
    id: "fonts",
    section: "Fonts",
    title: "Typography",
    access: "public",
    body: "Primary font: Inter (letter spacing -2 to -4) — use everywhere possible, especially external/public-facing work. Fallback: Arial, only for technical limitations. Type scale: Heading Large/Small in Inter Semi Bold (16–72px), Text/General Copy in Inter Regular (14–60px). Sentence case by default; initial caps for specific branding, formality, or emphasis.",
  },
  {
    id: "voice",
    section: "Voice",
    title: "Brand voice & writing rules",
    access: "public",
    body: "Simple, Bold, Smart — plain language, confident and direct, precise but not arrogant. Do: keep it short, cut fluff. Don't: drown in jargon, talk only about ourselves, or make it dry — bring the value back to the audience.",
  },
  {
    id: "sub-brands",
    section: "Sub-brands",
    title: "Sub-brand family",
    access: "public",
    body: "Strategy Mosaic — the product mark (gradient-tile circular supergraphic). Strategy One — the full product suite name, Inter font. Strategy Network — internal communities. Strategy World — the events brand, with regional editions sharing one logo and a per-city GenAI background.",
  },
  {
    id: "imagery",
    section: "Imagery",
    title: "GenAI imagery & look-and-feel modes",
    access: "internal",
    body: "GenAI imagery/video is an established production pipeline with a dedicated video team; public-use GenAI video needs CMO/Creative Director approval. Two documented look-and-feel modes: 'World' — crisp white backgrounds or gradient-blended imagery, optimistic. 'Corporations' — a darker tone spotlighting Bitcoin themes for a bold, crypto-centric aesthetic.",
  },
];

export function listGuidelines(role: "internal" | "external" | null): GuidelineEntry[] {
  return role === "internal" ? GUIDELINES : GUIDELINES.filter((g) => g.access === "public");
}

export function guidelinesContext(role: "internal" | "external" | null): string {
  return listGuidelines(role)
    .map((g) => `### ${g.section} — ${g.title}\n${g.body}`)
    .join("\n\n");
}
