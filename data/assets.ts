import type { BrandAsset } from "@/lib/types";

export const ASSETS: BrandAsset[] = [
  {
    id: "brandmark-primary",
    name: "Strategy brandmark — primary (black)",
    variant: "Primary",
    format: "PNG",
    access: "public",
    file: "/brand/strategy-logo-black.png",
    note: "Default brandmark for white/light backgrounds. Go-to version for official materials.",
  },
  {
    id: "brandmark-reversed",
    name: "Strategy brandmark — reversed (white)",
    variant: "Reversed",
    format: "PNG",
    access: "public",
    file: "/brand/strategy-logo-white.png",
    note: "Reversed white brandmark for black, dark, or photographic backgrounds.",
  },
  {
    id: "brandmark-orange",
    name: "Strategy brandmark — orange",
    variant: "Orange",
    format: "PNG",
    access: "public",
    file: "/brand/strategy-logo-orange.png",
    note: "Signature-orange (#FA660F) variant — accent placements only, used sparingly.",
  },
  {
    id: "mosaic-primary",
    name: "Strategy Mosaic logo — primary",
    variant: "Primary",
    format: "PNG",
    access: "public",
    file: "/brand/mosaic-logo.png",
    note: "Circular gradient-tile supergraphic — the standalone Mosaic product mark.",
  },
  {
    id: "mosaic-reversed",
    name: "Strategy Mosaic logo — reversed (white)",
    variant: "Reversed",
    format: "PNG",
    access: "public",
    file: "/brand/mosaic-logo-white.png",
    note: "Reversed white Mosaic mark for dark backgrounds.",
  },
];

export function listAssets(role: "internal" | "external" | null): BrandAsset[] {
  return role === "internal" ? ASSETS : ASSETS.filter((a) => a.access === "public");
}

export function findAsset(id: string, role: "internal" | "external" | null): BrandAsset | null {
  const asset = ASSETS.find((a) => a.id === id);
  if (!asset) return null;
  if (asset.access === "internal" && role !== "internal") return null;
  return asset;
}

export function queryAssets(term: string, role: "internal" | "external" | null): BrandAsset[] {
  const q = term.toLowerCase();
  return listAssets(role).filter(
    (a) => a.name.toLowerCase().includes(q) || a.variant.toLowerCase().includes(q) || a.note.toLowerCase().includes(q)
  );
}
