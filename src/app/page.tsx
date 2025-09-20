"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SigninPage() {
  const [email, setEmail] = useState("")
  const [studentId, setStudentId] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<null | { text: string; ok: boolean }>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, studentId }),
      })

      const ct = res.headers.get("content-type") || ""
      const payload = ct.includes("application/json")
        ? await res.json()
        : { success: false, admin: false, error: await res.text() } // <- HTML or text

      if (!res.ok) {
        setMsg({ text: payload.error || `Request failed (${res.status})`, ok: false })
        return
      }

      if (payload.success) {
        setMsg({ text: payload.admin ? "Admin login successful" : "Student login successful", ok: true })
        setTimeout(() => router.push(payload.admin ? "/admin/student-all" : "/student/personal"), 600)
      } else {
        setMsg({ text: "Invalid email or student ID", ok: false })
      }
    } catch (err: any) {
      setMsg({ text: err?.message ?? "Unexpected error", ok: false })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-center text-xl font-semibold tracking-tight text-black">Sign-in</h1>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none ring-0 transition focus:border-gray-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="studentId" className="mb-1 block text-sm font-medium text-gray-700">
              Student ID
            </label>
            <input
              id="studentId"
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none ring-0 transition focus:border-gray-900"
              placeholder="e.g. 69XXXXXX or 0 for admin"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {msg && (
            <p
              className={`mt-2 text-center text-sm ${msg.ok ? "text-emerald-600" : "text-rose-600"
                }`}
            >
              {msg.text}
            </p>
          )}
        </div>
      </form>
    </main>
  )
}