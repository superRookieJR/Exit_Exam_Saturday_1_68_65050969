import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

function ageFromBirth(dateStrOrDate: string | Date) {
  const d = new Date(dateStrOrDate)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

/**
 * GET /api/students
 * query:
 *  - q?: string
 *  - school?: string
 *  - sort?: "name" | "age"       (default "name")
 *  - order?: "asc" | "desc"      (default "asc")
 *  - limit?: number (<=200)
 *  - offset?: number
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const q = searchParams.get("q")?.trim() || ""
  const school = searchParams.get("school")?.trim() || ""
  const sort = (searchParams.get("sort") || "name") as "name" | "age"
  const order = (searchParams.get("order") || "asc") as "asc" | "desc"
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200)
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0)

  const where: any = {}

  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { fname: { contains: q, mode: "insensitive" } },
      { lname: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ]
  }

  if (school) {
    // exact match; ถ้าต้องการแบบ contains ให้ใช้ { contains: school, mode:"insensitive" }
    where.current_school = { equals: school }
  }

  // ดึงข้อมูลจาก DB (ยังไม่ sort โดย age ที่ DB เพราะคำนวณภายหลัง)
  // ถ้า sort=name -> ให้ DB ช่วยจัดลำดับก่อน
  const orderBy =
    sort === "name"
      ? [{ lname: order }, { fname: order }]
      : [{ lname: "asc" }, { fname: "asc" }]

  const [rows, total] = await Promise.all([
    prisma.students.findMany({
      where,
      skip: offset,
      take: limit,
    }),
    prisma.students.count({ where }),
  ])

  // enrich
  const enriched = rows.map((s) => ({
    ...s,
    age: ageFromBirth(s.birth_date as unknown as string),
    name: `${s.fname} ${s.lname}`,
  }))

  // ถ้า sort=age ให้ sort ตอนนี้ (หลังคำนวณ age แล้ว)
  let items = enriched
  if (sort === "age") {
    items = enriched.sort((a, b) =>
      order === "asc" ? a.age - b.age : b.age - a.age
    )
  }

  return NextResponse.json({ total, items })
}