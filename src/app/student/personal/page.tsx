import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

import { unstable_noStore } from "next/cache"

function ageFromBirth(d: Date) {
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export default async function MePage() {
  unstable_noStore() 
  
  const session = await getSession()
  if (!session || session.role !== "student") {
    redirect("/")
  }

  const me = await prisma.students.findUnique({
    where: { id: session.studentId },
    include: {
      registeredSubjects: {
        where: { grade: { not: null } },
        include: { subject: true },
        orderBy: [{ academicYear: "desc" }],
      },
    },
  })

  if (!me) {
    redirect("/")
  }

  const age = ageFromBirth(me.birth_date)

  return (
    <main className="min-h-dvh bg-gray-50 text-gray-900 font-sans">
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Header */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">ประวัติของฉัน</h1>
          <p className="mt-1 text-sm text-gray-600">
            หน้านี้แสดงเฉพาะข้อมูลของคุณเท่านั้น
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-xs text-gray-500">ชื่อ–สกุล</div>
              <div className="mt-1 font-medium text-gray-800">
                {me.prefix} {me.fname} {me.lname}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-xs text-gray-500">อีเมล</div>
              <div className="mt-1 font-medium text-gray-800">{me.email}</div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-xs text-gray-500">โรงเรียน</div>
              <div className="mt-1 font-medium text-gray-800">{me.current_school}</div>
            </div>
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-xs text-gray-500">อายุโดยประมาณ</div>
              <div className="mt-1 font-medium text-gray-800">{age} ปี</div>
            </div>
          </div>

          <form action="/api/auth/logout" method="post" className="mt-4">
            <button className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
              ออกจากระบบ
            </button>
          </form>
        </section>

        {/* Registered subjects with grade */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">รายวิชาที่ลงและได้รับเกรดแล้ว</h2>
            <p className="text-sm text-gray-600">
              แสดงเฉพาะวิชาที่มีเกรด (ไม่รวมวิชาที่ยังไม่ตัดเกรด)
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3">ปีการศึกษา</th>
                  <th className="px-4 py-3">ภาคการศึกษา</th>
                  <th className="px-4 py-3">รหัส/ชื่อวิชา</th>
                  <th className="px-4 py-3">หน่วยกิต</th>
                  <th className="px-4 py-3">เกรด</th>
                </tr>
              </thead>
              <tbody>
                {me.registeredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      ยังไม่มีรายวิชาที่ได้รับเกรด
                    </td>
                  </tr>
                ) : (
                  me.registeredSubjects.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{r.academicYear}</td>
                      <td className="px-4 py-3 text-gray-700">{r.semester}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-gray-700">{r.subject.id}</div>
                        <div className="text-gray-800">{r.subject.name}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{r.subject.credit}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{r.grade}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}