import mongoose from "mongoose";
import { initialStudents, initialFaculties } from "../src/data.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/erp_db";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("[MongoDB] Connected successfully to:", MONGODB_URI.split("@").pop() || "local");
    await seedIfEmpty();
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error);
    process.exit(1);
  }
}

async function seedIfEmpty(): Promise<void> {
  const { FacultyModel } = await import("./models/Faculty.js");
  const { StudentModel } = await import("./models/Student.js");
  const { AdminModel } = await import("./models/Admin.js");
  const bcrypt = await import("bcryptjs");

  const facultyCount = await FacultyModel.countDocuments();
  const studentCount = await StudentModel.countDocuments();
  const adminCount = await AdminModel.countDocuments();

  // Always ensure HOD admin accounts exist with at least the default password.
  // If they already exist we leave their password as-is (user may have changed it).
  // If they don't exist we create them with the default password.
  const defaultAdminPassword = await bcrypt.hash("Hod@Admin123", 10);

  for (const username of ["admin", "hod@college.edu"]) {
    const existing = await (AdminModel as any).findOne({ username });
    if (!existing) {
      await (AdminModel as any).create({ username, password: defaultAdminPassword });
      console.log(`[MongoDB] Created HOD admin account: ${username}`);
    }
  }

  if (facultyCount === 0) {
    const facultiesWithActive = initialFaculties.map((f: any) => ({
      ...f,
      isActive: true,
      phone: f.phone || "9876543210",
      facultyAttendance: f.facultyAttendance || 95,
      subjectCode: f.subjectCode || "AD3311"
    }));
    await FacultyModel.insertMany(facultiesWithActive as any[]);
    console.log(`[MongoDB] Seeded ${initialFaculties.length} active faculties`);
  }

  if (studentCount === 0) {
    await StudentModel.insertMany(initialStudents as any[]);
    console.log(`[MongoDB] Seeded ${initialStudents.length} students`);
  }
}

export default mongoose;
