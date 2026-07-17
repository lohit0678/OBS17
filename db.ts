import path from "path";
import { DatabaseSync } from "node:sqlite";
import { initialStudents, initialFaculties, Student, Faculty } from "./src/data.js";

const DB_DIR = path.resolve(process.cwd());
const DB_FILE = path.join(DB_DIR, "app.db");

const db = new DatabaseSync(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS faculties (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
`);

function ensureSeedData() {
  const facultyCount = db.prepare("SELECT COUNT(*) as count FROM faculties").get()?.count ?? 0;
  const studentCount = db.prepare("SELECT COUNT(*) as count FROM students").get()?.count ?? 0;

  if (facultyCount === 0) {
    for (const faculty of initialFaculties) {
      db.prepare("INSERT INTO faculties (id, data) VALUES (?, ?)").run(faculty.id, JSON.stringify(faculty));
    }
  }

  if (studentCount === 0) {
    for (const student of initialStudents) {
      db.prepare("INSERT INTO students (id, data) VALUES (?, ?)").run(student.id, JSON.stringify(student));
    }
  }
}

ensureSeedData();

export function loadDatabase() {
  const facultyRows = db.prepare("SELECT id, data FROM faculties ORDER BY id").all() as Array<{ id: string; data: string }>;
  const studentRows = db.prepare("SELECT id, data FROM students ORDER BY id").all() as Array<{ id: string; data: string }>;

  return {
    faculties: facultyRows.map((row) => JSON.parse(row.data) as Faculty),
    students: studentRows.map((row) => JSON.parse(row.data) as Student),
  };
}

export function saveDatabase(students: Student[], faculties: Faculty[]) {
  const insertStudent = db.prepare("INSERT OR REPLACE INTO students (id, data) VALUES (?, ?)");
  const insertFaculty = db.prepare("INSERT OR REPLACE INTO faculties (id, data) VALUES (?, ?)");

  db.exec("BEGIN TRANSACTION;");
  try {
    for (const student of students) {
      insertStudent.run(student.id, JSON.stringify(student));
    }
    for (const faculty of faculties) {
      insertFaculty.run(faculty.id, JSON.stringify(faculty));
    }
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
}

export function getDb() {
  return db;
}
