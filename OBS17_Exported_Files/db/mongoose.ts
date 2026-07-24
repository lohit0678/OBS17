import mongoose from "mongoose";
import net from "net";
import path from "path";
import fs from "fs";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  console.warn("[MongoDB] Could not set custom DNS servers:", err);
}

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
      
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      } else {
        const lockPath = path.join(dbPath, "mongod.lock");
        if (fs.existsSync(lockPath)) {
          try {
            fs.unlinkSync(lockPath);
            console.log("[MongoDB] Cleaned up leftover mongod.lock file from a previous unclean shutdown.");
          } catch (lockError) {
            console.warn("[MongoDB] ⚠️ Could not remove mongod.lock file (it might be locked by another running process):", lockError);
          }
        }
      }
      
      const mongod = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: "wiredTiger",
          dbName: "erp_db",
        },
      });
      const uri = mongod.getUri("erp_db");
      await mongoose.connect(uri);
      console.log("[MongoDB] ✅ Connected successfully to persistent database engine at:", dbPath, "using URI:", uri);
      
      // Migrate old data from random UUID databases if any exist
      await migrateOldDatabases();
    }
    await seedIfEmpty();
  } catch (error) {
    console.error("[MongoDB] ❌ Connection failed:", error);
    process.exit(1);
  }
}

async function migrateOldDatabases() {
  try {
    const adminDb = mongoose.connection.db!.admin();
    const { databases } = await adminDb.listDatabases();
    
    const systemDbs = ["admin", "local", "config", "erp_db"];
    const oldDbs = databases
      .map((d: any) => d.name)
      .filter((name: string) => !systemDbs.includes(name));
      
    if (oldDbs.length === 0) {
      return;
    }
    
    console.log(`[MongoDB Migration] Found old database(s) to migrate: ${oldDbs.join(", ")}`);
    
    for (const dbName of oldDbs) {
      console.log(`[MongoDB Migration] Migrating data from database: ${dbName}...`);
      const oldDb = mongoose.connection.useDb(dbName);
      if (!oldDb.db) continue;
      
      const collections = await oldDb.db.listCollections().toArray();
      
      for (const col of collections) {
        const colName = col.name;
        if (colName.startsWith("system.")) continue;
        
        const docs = await oldDb.db.collection(colName).find({}).toArray();
        if (docs.length === 0) continue;
        
        console.log(`[MongoDB Migration] Copying ${docs.length} documents from collection "${colName}" of database "${dbName}"...`);
        
        const targetCol = mongoose.connection.db!.collection(colName);
        for (const doc of docs) {
          try {
            await targetCol.updateOne(
              { _id: doc._id },
              { $set: doc },
              { upsert: true }
            );
          } catch (docError: any) {
            if (docError.code === 11000) {
              console.warn(`[MongoDB Migration] ⚠️ Skipping duplicate document in "${colName}" (key conflict): ${docError.message.split("dup key:").pop()}`);
            } else {
              throw docError;
            }
          }
        }
      }
      
      console.log(`[MongoDB Migration] Drop old database: ${dbName}...`);
      await oldDb.db.dropDatabase();
    }
    console.log("[MongoDB Migration] Migration completed successfully!");
  } catch (error) {
    console.error("[MongoDB Migration] Error during migration:", error);
  }
}

async function seedIfEmpty(): Promise<void> {
  const { FacultyModel } = await import("./models/Faculty.js");
  const { StudentModel } = await import("./models/Student.js");
  const { AdminModel } = await import("./models/Admin.js");
  const bcrypt = await import("bcryptjs");

  const ACCOUNTS = [
    { username: "admin@pec", password: "adminpec@123" },
    { username: "admin@pec.in", password: "adminds@123" },
    { username: "aidshod@pec.in", password: "hodpec@123" }
  ];

  // Remove legacy HOD admin credentials
  const allowedUsernames = ACCOUNTS.map(a => a.username);
  await (AdminModel as any).deleteMany({ username: { $nin: allowedUsernames } });

  for (const acc of ACCOUNTS) {
    const existing = await (AdminModel as any).findOne({ username: acc.username });
    if (!existing) {
      const defaultAdminPassword = await bcrypt.hash(acc.password, 10);
      await (AdminModel as any).create({ username: acc.username, password: defaultAdminPassword });
      console.log(`[MongoDB] Created HOD admin account: ${acc.username}`);
    }
  }

  // One-time normalisation of existing student roll numbers to remove spaces
  try {
    const students = await (StudentModel as any).find({ rollNo: { $regex: /\s/ } });
    if (students.length > 0) {
      console.log(`[MongoDB Migration] Normalizing roll numbers for ${students.length} students (removing spaces)...`);
      for (const student of students) {
        const oldRoll = student.rollNo;
        const newRoll = String(oldRoll).replace(/\s+/g, '').toUpperCase();
        student.rollNo = newRoll;
        await student.save();
        console.log(`[MongoDB Migration] Normalized student "${student.name}": "${oldRoll}" -> "${newRoll}"`);
      }
    }
  } catch (migErr) {
    console.error("[MongoDB Migration] Error normalising student roll numbers:", migErr);
  }
}

export default mongoose;
