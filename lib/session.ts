import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserSession } from "@/lib/types";

const COOKIE = "brandos_user";

export async function currentUser(): Promise<UserSession | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UserSession;
    return parsed.role === "internal" || parsed.role === "external" ? parsed : null;
  } catch {
    return null;
  }
}

export async function signIn(user: UserSession) {
  const jar = await cookies();
  jar.set(COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function requireUser(): Promise<UserSession> {
  const user = await currentUser();
  if (!user) redirect("/");
  return user;
}
