"use client"

import { useEffect, useMemo, useState } from "react"

type Avail = {
  id: string
  name: string
  credit: number
  teacher: string | null
  prerequisiteId: string | null
  prerequisiteName: string | null
  eligible: boolean
}

export default function RegisterPage() {
  const [course, setCourse] = useState("")
  const [major, setMajor] = useState("")
  const [semester, setSemester] = useState<"" | "S1" | "S2">("")
  const [items, setItems] = useState<Avail[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string>("")

  const courses = ["Course 1", "Course 2", "Course 3", "Course 4", "Course 5"]
  const majors = ["Software Engineering", "Data Science", "Information Systems", "Cyber Security"]

  const params = useMemo(() => {
    const sp = new URLSearchParams()
    if (course) sp.set("course", course)
    if (major) sp.set("major", major)
    if (semester) sp.set("semester", semester)
    return sp.toString()
  }, [course, major, semester])

  useEffect(() => {
    setLoading(true)
    setMsg("")
    fetch(`/api/subjects/available?${params}`)
      .then(async (r) => {
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || "Load failed")
        setItems(j.items || [])
      })
      .catch((e) => {
        setItems([])
        setMsg(e.message || "โหลดข้อมูลล้มเหลว")
      })
      .finally(() => setLoading(false))
  }, [params])

  async function registerSubject(subjId: string) {
    setMsg("")
    const now = new Date()
    const academicYear = now.getFullYear()
    const sem = (semester || "S1") as "S1" | "S2"

    const res = await fetch("/api/course/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId: subjId, semester: sem, academicYear }),
    })
    const j = await res.json()

    if (!res.ok) {
      setMsg(j?.error || "ลงทะเบียนไม่สำเร็จ")
      return
    }
  }

  return (
    <main className="min-h-dvh bg-gray-50 text-gray-900 font-sans">
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">ลงทะเบียนเรียน</h1>
            <p className="text-sm text-gray-600">
              แสดงรายวิชาในหลักสูตรที่คุณยังไม่ได้ลงทะเบียน
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 sm:gap-3 text-gray-800">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">หลักสูตร</label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-900"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              >
                <option value="">ทั้งหมด</option>
                {courses.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">สาขา</label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-900"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              >
                <option value="">ทั้งหมด</option>
                {majors.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">ภาคการศึกษา</label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-900"
                value={semester}
                onChange={(e) => setSemester(e.target.value as any)}
              >
                <option value="">ทั้งหมด</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
              </select>
            </div>
          </div>
        </header>

        {msg && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {msg}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3">รหัสวิชา</th>
                <th className="px-4 py-3">ชื่อวิชา</th>
                <th className="px-4 py-3">หน่วยกิต</th>
                <th className="px-4 py-3">อาจารย์</th>
                <th className="px-4 py-3">วิชาบังคับก่อน</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">กำลังโหลด…</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">ไม่พบรายวิชาที่พร้อมให้ลงทะเบียน</td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">{s.credit}</td>
                    <td className="px-4 py-3 text-gray-800">{s.teacher || "-"}</td>
                    <td className="px-4 py-3">
                      {s.prerequisiteId ? (
                        <>
                          <div className="font-mono text-xs text-gray-700">{s.prerequisiteId}</div>
                          <div className="text-gray-600">{s.prerequisiteName}</div>
                        </>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {s.eligible ? (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">ลงได้</span>
                      ) : (
                        <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">ยังลงไม่ได้</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={!s.eligible}
                        onClick={() => registerSubject(s.id)}
                        className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        ลงทะเบียน
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}