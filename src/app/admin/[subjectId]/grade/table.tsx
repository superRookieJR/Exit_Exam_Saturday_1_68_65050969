"use client"

import { useEffect, useMemo, useState } from "react"

const GRADES: Array<TableGrade["grade"]> = ["A","B_PLUS","B","C_PLUS","C","D_PLUS","D","F", null]

export default function ClientGradeEditor({ subjectId }: { subjectId: string }) {
  const [rows, setRows] = useState<TableGrade[]>([])
  const [count, setCount] = useState(0)
  const [subjectName, setSubjectName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string>("")

  async function load() {
    setLoading(true)
    setMsg("")
    try {
      const res = await fetch(`/api/admin/registrations?subjectId=${encodeURIComponent(subjectId)}`, { cache: "no-store" })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || "โหลดข้อมูลล้มเหลว")
      setRows(j.items || [])
      setCount(j.count || 0)
      setSubjectName(j.subject?.name || subjectId)
    } catch (e: any) {
      setRows([])
      setCount(0)
      setMsg(e?.message || "โหลดข้อมูลล้มเหลว")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [subjectId])

  async function save(regId: number, grade: TableGrade["grade"]) {
    setMsg("")
    const res = await fetch("/api/admin/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: regId, grade }),
    })
    const j = await res.json()
    if (!res.ok) {
      setMsg(j?.error || "บันทึกเกรดไม่สำเร็จ")
      return
    }
    // update row locally
    setRows(prev => prev.map(r => r.id === regId ? { ...r, grade: j.grade } : r))
    setMsg("บันทึกเกรดสำเร็จ")
  }

  const registeredCount = useMemo(() => count, [count])

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <div className="text-sm text-gray-500">รายวิชา</div>
          <div className="font-medium">{subjectId} — {subjectName || "-"}</div>
        </div>
        <div className="text-sm text-gray-600">
          ผู้ลงทะเบียนรวม: <span className="font-semibold">{registeredCount}</span> คน
        </div>
      </div>

      {msg && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {msg}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">ชื่อ</th>
              <th className="px-4 py-3">อีเมล</th>
              <th className="px-4 py-3">ปี</th>
              <th className="px-4 py-3">ภาค</th>
              <th className="px-4 py-3">เกรด</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">กำลังโหลด…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">ยังไม่มีผู้ลงทะเบียน</td>
              </tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{r.studentId}</td>
                <td className="px-4 py-3">{r.studentName}</td>
                <td className="px-4 py-3 text-gray-700">{r.email}</td>
                <td className="px-4 py-3">{r.academicYear}</td>
                <td className="px-4 py-3">{r.semester}</td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={r.grade ?? ""}
                    onChange={(e) => setRows(prev => prev.map(x => x.id === r.id ? { ...x, grade: (e.target.value || null) as TableGrade["grade"] } : x))}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="">(ยังไม่ตัด)</option>
                    {GRADES.filter(g => g !== null).map(g => (
                      <option key={g!} value={g!}>{g}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-100"
                    onClick={() => {
                      const updated = rows.find(x => x.id === r.id)?.grade ?? null
                      save(r.id, updated)
                    }}
                  >
                    บันทึก
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}