import { NextResponse } from "next/server";
import { currentUser } from "@/lib/session";
import { listGuidelines } from "@/data/guidelines";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ guidelines: listGuidelines(user.role) });
}
