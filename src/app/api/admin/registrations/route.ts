export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const subjectId = searchParams.get("subjectId")
  if (!subjectId) {
    return NextResponse.json({ error: "subjectId is required" }, { status: 400 })
  }

  const regs = await prisma.registeredSubject.findMany({
    where: { subjectId },
    include: {
      student: true,
      subject: true,
    },
    orderBy: [{ academicYear: "desc" }, { semester: "desc" }],
  })

  return NextResponse.json({
    subject: regs[0]?.subject ?? (await prisma.subjects.findUnique({ where: { id: subjectId } })),
    count: regs.length,
    items: regs.map(r => ({
      id: r.id, // registration id
      studentId: r.studentId,
      studentName: `${r.student.prefix} ${r.student.fname} ${r.student.lname}`,
      email: r.student.email,
      academicYear: r.academicYear,
      semester: r.semester,
      grade: r.grade, // may be null
    })),
  })
}