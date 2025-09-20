import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import ClientGradeEditor from "./table"

export default async function AdminGradePage({ params }: { params: { subjectId: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    redirect("/signin")
  }

  return (
    <main className="min-h-dvh bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-bold tracking-tight">กรอกเกรดรายวิชา</h1>
        <p className="mt-1 text-sm text-gray-600">เฉพาะผู้ดูแลระบบเท่านั้น</p>
        <div className="mt-6">
          <GradeEditor subjectId={params.subjectId} />
        </div>
      </div>
    </main>
  )
}

function GradeEditor(props: { subjectId: string }) {
  return <ClientGradeEditor subjectId={props.subjectId} />
}
