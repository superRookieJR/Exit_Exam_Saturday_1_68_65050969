export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

const ALLOWED = ["A","B_PLUS","B","C_PLUS","C","D_PLUS","D","F", null] as const
type GradeType = (typeof ALLOWED)[number]

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { registrationId, grade } = await req.json() as { registrationId: number; grade: GradeType }
    if (typeof registrationId !== "number") {
      return NextResponse.json({ error: "registrationId must be a number" }, { status: 400 })
    }
    if (!ALLOWED.includes(grade as any)) {
      return NextResponse.json({ error: "invalid grade" }, { status: 400 })
    }

    const updated = await prisma.registeredSubject.update({
      where: { id: registrationId },
      data: { grade: grade as any },
      include: { student: true, subject: true },
    })

    return NextResponse.json({
      id: updated.id,
      grade: updated.grade,
      studentId: updated.studentId,
      subjectId: updated.subjectId,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid" }, { status: 400 })
  }
}