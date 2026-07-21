import mongoose from "mongoose";
import net from "net";
import path from "path";

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
  const targetUri = process.env.MONGODB_URI;

  if (targetUri) {
    try {
      console.log("[MongoDB] Attempting connection to configured MONGODB_URI...");
      await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 15000 });
      console.log("[MongoDB] ✅ Connected successfully to MongoDB Atlas:", targetUri.split("@").pop() || "configured URI");
      await seedIfEmpty();
      return;
    } catch (error: any) {
      console.warn(`[MongoDB] ⚠️ Primary MongoDB connection failed: ${error.message || error}`);
      console.warn("[MongoDB] Falling back to persistent local storage so data is preserved across restarts...");
    }
  }

  try {
    const localMongoRunning = await isPortOpen(27017, "127.0.0.1");
    if (localMongoRunning) {
      const localUri = "mongodb://localhost:27017/erp_db";
      await mongoose.connect(localUri);
      console.log("[MongoDB] ✅ Connected successfully to local database on port 27017");
    } else {
      console.log("[MongoDB] Local MongoDB service not detected. Initializing persistent local database (.mongo_data)...");
      // @ts-ignore
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const dbPath = path.resolve(process.cwd(), ".mongo_data");
      
      const mongod = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: "wiredTiger",
        },
      });
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log("[MongoDB] ✅ Connected successfully to persistent database engine at:", dbPath);
    }
    await seedIfEmpty();
  } catch (error) {
    console.error("[MongoDB] ❌ Connection failed:", error);
    process.exit(1);
  }
}

async function seedIfEmpty(): Promise<void> {
  const { FacultyModel } = await import("./models/Faculty.js");
  const { StudentModel } = await import("./models/Student.js");
  const { AdminModel } = await import("./models/Admin.js");
  const bcrypt = await import("bcryptjs");

  // Ensure HOD admin accounts exist with at least the default password.
  const defaultAdminPassword = await bcrypt.hash("Hod@Admin123", 10);

  for (const username of ["admin", "hod@college.edu"]) {
    const existing = await (AdminModel as any).findOne({ username });
    if (!existing) {
      await (AdminModel as any).create({ username, password: defaultAdminPassword });
      console.log(`[MongoDB] Created HOD admin account: ${username}`);
    }
  }
}

export default mongoose;
