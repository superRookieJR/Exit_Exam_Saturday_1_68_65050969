import { cookies } from "next/headers"

export type Session =
  | { role: "student"; studentId: string }
  | { role: "admin" }

const COOKIE_NAME = "session"

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies() // 👈 ต้อง await
    const c = cookieStore.get(COOKIE_NAME)?.value
    if (!c) return null

    const parsed = JSON.parse(c)
    if (
      (parsed.role === "student" && typeof parsed.studentId === "string") ||
      parsed.role === "admin"
    ) {
      return parsed as Session
    }
    return null
  } catch {
    return null
  }
}

export function makeSessionCookie(value: Session) {
  return {
    name: COOKIE_NAME,
    value: JSON.stringify(value),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // maxAge: 60 * 60 * 24 * 7,
  }
}