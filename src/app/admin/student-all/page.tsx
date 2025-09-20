"use client"

import { useEffect, useMemo, useState } from "react"

function ageFromBirth(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export default function StudentsPage() {
  const [items, setItems] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // controls (ทั้งหมดประมวลผลบน client)
  const [q, setQ] = useState("")
  const [school, setSchool] = useState("")
  const [sort, setSort] = useState<"name" | "age">("name")
  const [order, setOrder] = useState<"asc" | "desc">("asc")

  // ดึงข้อมูลครั้งเดียว (ดึงเยอะพอสมควรเพื่อให้กรอง/เรียงใน client ได้)
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        // ถ้ามี endpoint เฉพาะ all ก็ใช้ได้ เช่น /api/students/all
        // ที่นี่ใช้ /api/students แบบไม่ส่งตัวกรองและ limit สูงพอ
        const res = await fetch("/api/students?limit=10000&order=asc&sort=name", { cache: "no-store" })
        const data = await res.json()
        const rows: Student[] = data.items ?? data ?? []
        setItems(rows)
      } catch (e: any) {
        setError(e?.message ?? "โหลดข้อมูลล้มเหลว")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // รายชื่อโรงเรียน (คำนวณจากข้อมูลที่มี)
  const schools = useMemo(() => {
    const s = new Set<string>()
    for (const it of items) s.add(it.current_school)
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [items])

  // กรอง + เรียง (ทำใน client)
  const filteredAndSorted = useMemo(() => {
    let list = items

    // filter by school (exact)
    if (school) {
      list = list.filter((s) => s.current_school === school)
    }

    // search q on id/fname/lname/email (case-insensitive)
    const qx = q.trim().toLowerCase()
    if (qx) {
      list = list.filter((s) => {
        return (
          s.id.toLowerCase().includes(qx) ||
          s.fname.toLowerCase().includes(qx) ||
          s.lname.toLowerCase().includes(qx) ||
          s.email.toLowerCase().includes(qx)
        )
      })
    }

    // decorate age once for sorting
    const withAge = list.map((s) => ({
      ...s,
      age: ageFromBirth(s.birth_date),
    }))

    // sort
    if (sort === "name") {
      withAge.sort((a, b) => {
        const aKey = `${a.lname} ${a.fname}`.toLowerCase()
        const bKey = `${b.lname} ${b.fname}`.toLowerCase()
        const cmp = aKey.localeCompare(bKey)
        return order === "asc" ? cmp : -cmp
      })
    } else {
      // sort by age
      withAge.sort((a, b) => {
        const cmp = (a.age ?? 0) - (b.age ?? 0)
        return order === "asc" ? cmp : -cmp
      })
    }

    return withAge
  }, [items, q, school, sort, order])

  const total = items.length
  const hasFilter = !!q || !!school

  function toggleOrder() {
    setOrder((o) => (o === "asc" ? "desc" : "asc"))
  }
  function setSortBy(next: "name" | "age") {
    setSort((curr) => {
      if (curr === next) {
        toggleOrder()
        return curr
      }
      setOrder("asc")
      return next
    })
  }

  return (
    <main className="min-h-dvh bg-gray-50 text-gray-800">
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">รายชื่อนักเรียน</h1>
            <p className="text-sm text-gray-600">
              ทั้งหมด {total.toLocaleString()} รายการ{hasFilter ? " (มีการกรอง/ค้นหา)" : ""}
            </p>
            <div className="mt-2 inline-flex items-center gap-2 text-xs">
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-700">
                sort: <b>{sort}</b>
              </span>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-700">
                order: <b>{order}</b>
              </span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 sm:gap-3 text-gray-800">
            {/* Search */}
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-gray-700">ค้นหา (ID/ชื่อ/อีเมล)</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="พิมพ์คำค้น…"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-900"
              />
            </div>

            {/* Filter school */}
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-gray-700">กรองตามโรงเรียน</label>
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-900"
              >
                <option value="">ทั้งหมด</option>
                {schools.map((s) => (
                  <option key={s} value={s} className="text-gray-800">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick sort buttons */}
            <div className="flex items-end gap-2 sm:col-span-1">
              <button
                type="button"
                onClick={() => setSortBy("name")}
                className={`inline-flex h-[38px] items-center justify-center rounded-lg border px-3 text-sm font-medium ${
                  sort === "name"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
                }`}
              >
                เรียงตามชื่อ {sort === "name" ? (order === "asc" ? "↑" : "↓") : ""}
              </button>
              <button
                type="button"
                onClick={() => setSortBy("age")}
                className={`inline-flex h-[38px] items-center justify-center rounded-lg border px-3 text-sm font-medium ${
                  sort === "age"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 bg-white text-gray-800 hover:bg-gray-100"
                }`}
              >
                เรียงตามอายุ {sort === "age" ? (order === "asc" ? "↑" : "↓") : ""}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">
                  <button
                    onClick={() => setSortBy("name")}
                    className="inline-flex items-center gap-1 font-medium text-gray-800 hover:underline"
                    title="คลิกเพื่อเรียงตามชื่อ"
                  >
                    ชื่อ {sort === "name" ? (order === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3">โรงเรียน</th>
                <th className="px-4 py-3">
                  <button
                    onClick={() => setSortBy("age")}
                    className="inline-flex items-center gap-1 font-medium text-gray-800 hover:underline"
                    title="คลิกเพื่อเรียงตามอายุ"
                  >
                    อายุ {sort === "age" ? (order === "asc" ? "↑" : "↓") : ""}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    กำลังโหลด…
                  </td>
                </tr>
              ) : filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.id}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {s.prefix} {s.fname} {s.lname}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.email}</td>
                    <td className="px-4 py-3 text-gray-700">{s.current_school}</td>
                    <td className="px-4 py-3 text-gray-700">{ageFromBirth(s.birth_date)}</td>
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