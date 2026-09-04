export type Role = "internal" | "external";

export interface UserSession {
  name: string;
  role: Role;
}

export interface BrandAsset {
  id: string;
  name: string;
  variant: string;
  format: string;
  access: "public" | "internal";
  file: string;
  note: string;
}

export interface GuidelineEntry {
  id: string;
  section: string;
  title: string;
  access: "public" | "internal";
  body: string;
}

export interface PostState {
  headline: string;
  sub: string;
  cta: string;
  bg: "white" | "black" | "orange";
  brand: "strategy" | "mosaic";
  sizeId: "square" | "banner";
}
