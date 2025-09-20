export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { makeSessionCookie } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, studentId } = await req.json()

    // ทางลัด admin
    if (email === "admin@admin.com" && studentId === "0") {
      const res = NextResponse.json({ success: true, admin: true })
      const cookie = makeSessionCookie({ role: "admin" })
      res.cookies.set(cookie)
      return res
    }

    // ตรวจสอบนักเรียน
    const student = await prisma.students.findFirst({
      where: { email, id: studentId },
      select: { id: true },
    })

    if (student) {
      const res = NextResponse.json({ success: true, admin: false })
      const cookie = makeSessionCookie({ role: "student", studentId: student.id })
      res.cookies.set(cookie)
      return res
    }

    return NextResponse.json({ success: false, admin: false })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, admin: false, error: e?.message ?? "Invalid" },
      { status: 400 }
    )
  }
}