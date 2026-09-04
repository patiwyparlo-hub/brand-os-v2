import { NextRequest, NextResponse } from "next/server";
import { currentUser, signIn, signOut } from "@/lib/session";

export async function GET() {
  return NextResponse.json({ user: await currentUser() });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role = body.role === "internal" ? "internal" : "external";
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  await signIn({ name, role });
  return NextResponse.json({ user: { name, role } });
}

export async function DELETE() {
  await signOut();
  return NextResponse.json({ ok: true });
}
