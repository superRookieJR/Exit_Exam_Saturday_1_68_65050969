export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Semester } from "@/generated/prisma" // ถ้าใช้ custom output

function calcAge(d: Date) {
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { subjectId, semester, academicYear } = await req.json() as {
      subjectId: string
      semester: "S1" | "S2"
      academicYear: number
    }

    // 0) ตรวจพารามิเตอร์
    if (!subjectId || !semester || !academicYear) {
      return NextResponse.json({ error: "subjectId, semester, academicYear are required" }, { status: 400 })
    }

    // 1) ดึงข้อมูลนักเรียน + ตรวจอายุ >= 15
    const student = await prisma.students.findUnique({
      where: { id: session.studentId },
      select: { id: true, birth_date: true },
    })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })
    const age = calcAge(student.birth_date as unknown as Date)
    if (age < 15) {
      return NextResponse.json({ error: "อายุต่ำกว่า 15 ปี ไม่สามารถลงทะเบียนได้" }, { status: 400 })
    }

    // 2) ดึงข้อมูลวิชา + ตรวจ prerequisite
    const subject = await prisma.subjects.findUnique({
      where: { id: subjectId },
      include: { requiredBefore: true },
    })
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 })

    if (subject.requiredBeforeId) {
      // เช็คว่าลง/ได้เกรดวิชาบังคับก่อนหรือยัง
      const prereg = await prisma.registeredSubject.findFirst({
        where: {
          studentId: student.id,
          subjectId: subject.requiredBeforeId,
        },
        select: { grade: true },
      })

      // ยังไม่เคยลงเลย หรือเคยลงแต่ grade เป็น null/F → ห้ามลงต่อ
      const ok =
        prereg !== null &&
        prereg.grade !== null &&
        prereg.grade !== "F"

      if (!ok) {
        return NextResponse.json(
          { error: `ยังลงวิชาบังคับก่อน (${subject.requiredBefore?.name || subject.requiredBeforeId}) ไม่ผ่าน` },
          { status: 400 }
        )
      }
    }

    // 3) ป้องกันลงซ้ำเทอมเดียวกัน (อิง unique ของโมเดล)
    const dup = await prisma.registeredSubject.findUnique({
      where: {
        studentId_subjectId_academicYear_semester: {
          studentId: student.id,
          subjectId,
          academicYear,
          semester: semester as Semester,
        },
      },
    })
    if (dup) {
      return NextResponse.json({ error: "ลงทะเบียนซ้ำในเทอมเดียวกันแล้ว" }, { status: 400 })
    }

    // 4) สร้างรายการลงทะเบียน
    const created = await prisma.registeredSubject.create({
      data: {
        studentId: student.id,
        subjectId,
        academicYear,
        semester: semester as Semester,
        grade: null, // ยังไม่ตัดเกรด
      },
    })

    // 5) จำนวนคนที่ลงทะเบียนในวิชานี้ (≥ 0 เสมอ — assert/รายงาน)
    const count = await prisma.registeredSubject.count({ where: { subjectId } })
    if (count < 0) {
      // ทางทฤษฎีเกิดไม่ได้; ใส่เชิง defensively เผื่ออนาคตมี logic ลบผิด ฯลฯ
      return NextResponse.json({ error: "Internal count invariant broke" }, { status: 500 })
    }

    // 6) ส่งผลสำเร็จ (และฝั่ง client ให้ redirect ไป /student/personal)
    const res = NextResponse.json({ id: created.id, to: "/student/personal" }, { status: 201 })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Invalid" }, { status: 400 })
  }
}