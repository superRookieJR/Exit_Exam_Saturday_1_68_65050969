import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const runtime = "nodejs"

/**
 * GET /api/me/available-subjects
 * query:
 *  - course?: string       // course_name ใน SubjectStructure
 *  - major?: string        // major_name  ใน SubjectStructure
 *  - semester?: "S1"|"S2"  // open_semester ใน SubjectStructure
 *
 * ผลลัพธ์: รายวิชาในโครงสร้างหลักสูตรที่ "ฉันยังไม่เคยลงทะเบียน" + สถานะ prerequisite
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const course = searchParams.get("course") || undefined
  const major = searchParams.get("major") || undefined
  const semester = searchParams.get("semester") as "S1" | "S2" | null

  // 1) ดึงวิชาในโครงสร้างหลักสูตร (ตาม filter)
  const whereSS: any = {}
  if (course) whereSS.course_name = course
  if (major) whereSS.major_name = major
  if (semester) whereSS.open_semester = semester

  const structures = await prisma.subjectStructure.findMany({
    where: whereSS,
    include: {
      required_subject: true, // ใช้โชว์/ตรวจ prerequisite ด้วย
    },
  })

  // รหัสวิชาทั้งหมดในโครงสร้าง
  // หมายเหตุ: ที่ schema เราใช้ "required_subject_id" เพื่อชี้วิชาบังคับก่อน
  // แต่รายวิชาในหลักสูตรจริง ๆ คือ mapping ผ่าน subjectStructures เอง
  // ในตัวอย่างนี้จะถือว่า "required_subject_id" คือวิชาที่ต้องมาก่อน (ถ้ามี)
  // และ "ตัววิชา" ที่เปิดคือ inferred จาก required_subject_id? -> ปกติควรมีฟิลด์ subjectId ด้วย
  // หากคุณมีฟิลด์ subjectId ใน SubjectStructure ให้ใช้ตรงนั้นแทน
  // ที่นี่จะตีความว่า "required_subject_id" คือวิชาที่เป็น requirement ของวิชาหนึ่งในหลักสูตร
  // เพื่อความใช้งานได้ในทันที เราจะดึง "ทุก Subjects" แล้วกรองด้วย SubjectStructure ตาม course/major/semester
  // โดยใช้ชื่อที่อยู่ใน structures เพื่อเป็นทางเลือก
  const allSubjects = await prisma.subjects.findMany({
    include: { requiredBefore: true },
    orderBy: { id: "asc" },
  })

  // 2) ดึงวิชาที่ฉันเคยลงแล้วทั้งหมด
  const myRegs = await prisma.registeredSubject.findMany({
    where: { studentId: session.role === "student" ? session.studentId : "" },
    include: { subject: true },
  })
  const myRegisteredIds = new Set(myRegs.map((r) => r.subjectId))
  const myPassedIds = new Set(
    myRegs
      .filter((r) => r.grade !== null && r.grade !== "F") // ผ่านถ้าเกรดไม่ใช่ F และไม่ null
      .map((r) => r.subjectId)
  )

  // 3) ทำรายการวิชาตามโครงสร้างหลักสูตร
  //    ถ้ามี filter course/major/semester -> ใช้จาก structures
  //    ถ้าไม่มี filter -> ให้ถือว่า “ทั้งหลักสูตร” (แสดงทุกวิชา จาก Subjects)
  const inStructureSet = new Set<string>()
  if (structures.length > 0) {
    // กรณีมี filter: ข้อมูลใน SubjectStructure ไม่มี subjectId จริง เราจึง fallback เป็น required_subject_id
    // ถ้ามีข้อมูล subjectId ในระบบจริง ให้เปลี่ยนเป็น subjectId แทน
    for (const ss of structures) {
      if (ss.required_subject_id) inStructureSet.add(ss.required_subject_id)
    }
  } else {
    // ไม่มี filter -> ใช้วิชาทั้งหมด
    for (const s of allSubjects) inStructureSet.add(s.id)
  }

  // 4) สร้างผลลัพธ์: เฉพาะวิชาที่อยู่ใน structure และ "ฉันยังไม่เคยลง"
  const available = allSubjects
    .filter((subj) => inStructureSet.has(subj.id) && !myRegisteredIds.has(subj.id))
    .map((subj) => {
      const prereqId = subj.requiredBeforeId || null
      const hasPrereq = !!prereqId
      const prereqPassed = hasPrereq ? myPassedIds.has(prereqId!) : true
      return {
        id: subj.id,
        name: subj.name,
        credit: subj.credit,
        teacher: subj.teacher,
        prerequisiteId: prereqId,
        prerequisiteName: subj.requiredBefore?.name || null,
        eligible: prereqPassed, // ลงได้หรือไม่ (ผ่านวิชาบังคับก่อนแล้ว?)
      }
    })

  return NextResponse.json({
    items: available,
    count: available.length,
    filters: {
      course: course ?? null,
      major: major ?? null,
      semester: semester ?? null,
    },
  })
}