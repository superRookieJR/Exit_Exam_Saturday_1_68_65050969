/* prisma/seed.ts */
import { PrismaClient, Semester, Grade } from "../src/generated/prisma"
import fs from "fs"
import path from "path"

type DataFile = {
  students: Array<{
    id: string
    prefix: string
    fname: string
    lname: string
    birth_date: string
    current_school: string
    email: string
    // registered_course_code: string   // ❌ ไม่ใช้แล้วตาม schema ปัจจุบัน
  }>
  subjects: Array<{
    id: string
    name: string
    credit: number
    teacher?: string | null
    requiredBeforeId?: string | null
  }>
  subject_structures: Array<{
    // JSON ของคุณมี course_name, major_name, open_semester, required_subject_id
    course_name: string
    major_name: string
    open_semester: "S1" | "S2"
    required_subject_id: string | null
  }>
  registered_subjects: Array<{
    studentId: string
    subjectId: string
    semester: "S1" | "S2"
    academicYear: number
    grade?: "A" | "B_PLUS" | "B" | "C_PLUS" | "C" | "D_PLUS" | "D" | "F" | null
  }>
}

const prisma = new PrismaClient()

function makeSSId(ss: {
  course_name: string
  major_name: string
  required_subject_id: string | null
  open_semester: "S1" | "S2"
}) {
  // unique, stable, no spaces
  return [
    ss.course_name.replace(/\s+/g, "_"),
    ss.major_name.replace(/\s+/g, "_"),
    ss.required_subject_id ?? "NONE",
    ss.open_semester,
  ].join("-")
}

async function main() {
  const jsonPath = path.join(process.cwd(), "prisma", "example-data.json")
  const raw = fs.readFileSync(jsonPath, "utf-8")
  const data: DataFile = JSON.parse(raw)

  // 1) Students
  await prisma.students.createMany({
    data: data.students.map((s) => ({
      id: s.id,
      prefix: s.prefix,
      fname: s.fname,
      lname: s.lname,
      birth_date: new Date(s.birth_date),
      current_school: s.current_school,
      email: s.email,
    })),
  })

  // 2) Subjects
  await prisma.subjects.createMany({
    data: data.subjects.map((sub) => ({
      id: sub.id,
      name: sub.name,
      credit: sub.credit,
      teacher: sub.teacher ?? null,
      requiredBeforeId: sub.requiredBeforeId ?? null,
    })),
  })

  // 3) SubjectStructure
  await prisma.subjectStructure.createMany({
    data: data.subject_structures.map((ss) => ({
      id: makeSSId(ss), // 👈 generate id
      course_name: ss.course_name,
      major_name: ss.major_name,
      open_semester: ss.open_semester as Semester,
      required_subject_id: ss.required_subject_id ?? null,
      // relation field nameใน schema คือ required_subject_id + @relation("SubjectStructureRequired")
      // createMany จะใส่ FK ผ่าน required_subject_id ได้เลย
    })),
  })

  // 4) RegisteredSubject
  await prisma.registeredSubject.createMany({
    data: data.registered_subjects.map((r) => ({
      studentId: r.studentId,
      subjectId: r.subjectId,
      semester: r.semester as Semester,
      academicYear: r.academicYear,
      grade: (r.grade ?? null) as Grade | null,
    })),
  })

  console.log("✅ Seed completed.")
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
