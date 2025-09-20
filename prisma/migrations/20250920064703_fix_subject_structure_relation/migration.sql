-- CreateTable
CREATE TABLE "Students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prefix" TEXT NOT NULL,
    "fname" TEXT NOT NULL,
    "lname" TEXT NOT NULL,
    "birth_date" DATETIME NOT NULL,
    "current_school" TEXT NOT NULL,
    "email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Subjects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "credit" INTEGER NOT NULL,
    "teacher" TEXT,
    "requiredBeforeId" TEXT,
    CONSTRAINT "Subjects_requiredBeforeId_fkey" FOREIGN KEY ("requiredBeforeId") REFERENCES "Subjects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubjectStructure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_name" TEXT NOT NULL,
    "major_name" TEXT NOT NULL,
    "open_semester" TEXT NOT NULL,
    "required_subject_id" TEXT,
    CONSTRAINT "SubjectStructure_required_subject_id_fkey" FOREIGN KEY ("required_subject_id") REFERENCES "Subjects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegisteredSubject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "grade" TEXT,
    CONSTRAINT "RegisteredSubject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RegisteredSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subjects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Students_email_key" ON "Students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredSubject_studentId_subjectId_academicYear_semester_key" ON "RegisteredSubject"("studentId", "subjectId", "academicYear", "semester");
