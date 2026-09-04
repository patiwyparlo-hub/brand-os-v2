export type FormatId = "square" | "landscape" | "wide" | "story" | "document";

export const FORMATS: { id: FormatId; name: string; hint: string; ratio: string }[] = [
  { id: "square", name: "Square", hint: "Instagram", ratio: "1 / 1" },
  { id: "landscape", name: "Landscape", hint: "Facebook, LinkedIn", ratio: "1.9 / 1" },
  { id: "wide", name: "Wide", hint: "Slides", ratio: "16 / 9" },
  { id: "story", name: "Story", hint: "Reels, TikTok", ratio: "9 / 16" },
  { id: "document", name: "Document", hint: "Reports, PDF", ratio: "3 / 4" },
];
