import mongoose from "mongoose";
import net from "net";
import { initialStudents, initialFaculties } from "../src/data.js";

let MONGODB_URI = process.env.MONGODB_URI;

function isPortOpen(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export async function connectDB(): Promise<void> {
  try {
    let usingMemoryServer = false;
    if (!MONGODB_URI) {
      // Check if local Mongo is running on port 27017
      const localMongoRunning = await isPortOpen(27017, "127.0.0.1");
      if (localMongoRunning) {
        MONGODB_URI = "mongodb://localhost:27017/erp_db";
      } else {
        console.log("[MongoDB] Local MongoDB server not detected. Starting in-memory MongoDB server...");
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const mongod = await MongoMemoryServer.create();
        MONGODB_URI = mongod.getUri();
        usingMemoryServer = true;
      }
    }

    await mongoose.connect(MONGODB_URI);
    if (usingMemoryServer) {
      console.log("[MongoDB] Connected successfully to in-memory database:", MONGODB_URI);
    } else {
      console.log("[MongoDB] Connected successfully to:", MONGODB_URI.split("@").pop() || "local");
    }
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
