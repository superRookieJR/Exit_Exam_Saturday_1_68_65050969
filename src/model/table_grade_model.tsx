type TableGrade = {
  id: number
  studentId: string
  studentName: string
  email: string
  academicYear: number
  semester: "S1" | "S2"
  grade: "A"|"B_PLUS"|"B"|"C_PLUS"|"C"|"D_PLUS"|"D"|"F"|null
}