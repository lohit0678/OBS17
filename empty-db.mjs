import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/erp_db";

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const AdminModel = mongoose.models.Admin ?? mongoose.model("Admin", AdminSchema);

async function emptyDatabase() {
  console.log("[Empty DB] Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("[Empty DB] Connected to MongoDB.");

  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    const countBefore = await collection.countDocuments();
    await collection.deleteMany({});
    console.log(`[Empty DB] Cleared collection: ${collection.collectionName} (deleted ${countBefore} documents)`);
  }

  // Clear local SQLite app.db and db_storage.json if present
  const sqliteDb = path.join(process.cwd(), "app.db");
  if (fs.existsSync(sqliteDb)) {
    try {
      fs.unlinkSync(sqliteDb);
      console.log("[Empty DB] Deleted local app.db");
    } catch (e) {
      console.error("[Empty DB] Could not delete app.db:", e);
    }
  }

  const jsonStorage = path.join(process.cwd(), "db_storage.json");
  if (fs.existsSync(jsonStorage)) {
    try {
      fs.unlinkSync(jsonStorage);
      console.log("[Empty DB] Deleted local db_storage.json");
    } catch (e) {
      console.error("[Empty DB] Could not delete db_storage.json:", e);
    }
  }

  // Re-create default HOD Admin accounts so the system remains usable
  const DEFAULT_PASSWORD = "Hod@Admin123";
  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  for (const username of ["admin", "hod@college.edu"]) {
    await AdminModel.create({ username, password: hashed });
    console.log(`[Empty DB] ✅ Reset default admin account: ${username}`);
  }

  console.log("\n✅ Database emptied successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

emptyDatabase().catch((err) => {
  console.error("[Empty DB] Error:", err);
  process.exit(1);
});
