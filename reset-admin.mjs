/**
 * reset-admin.mjs
 * Run once to reset / create the HOD admin accounts in MongoDB.
 * Usage: node reset-admin.mjs
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/erp_db";

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const AdminModel = mongoose.models.Admin ?? mongoose.model("Admin", AdminSchema);

async function resetAdmins() {
  console.log("[reset-admin] Connecting to:", MONGODB_URI.split("@").pop());
  await mongoose.connect(MONGODB_URI);
  console.log("[reset-admin] Connected!");

  const DEFAULT_PASSWORD = "Hod@Admin123";
  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const username of ["admin", "hod@college.edu"]) {
    const result = await AdminModel.findOneAndUpdate(
      { username },
      { $set: { username, password: hashed } },
      { upsert: true, new: true }
    );
    console.log(`[reset-admin] ✅ Account ready: ${result.username}`);
  }

  console.log("\n✅ Both HOD admin accounts reset successfully!");
  console.log("   Username: admin          | Password: Hod@Admin123");
  console.log("   Username: hod@college.edu | Password: Hod@Admin123");
  await mongoose.disconnect();
  process.exit(0);
}

resetAdmins().catch(err => {
  console.error("[reset-admin] Error:", err);
  process.exit(1);
});
