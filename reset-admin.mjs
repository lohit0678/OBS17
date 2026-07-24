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
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  console.warn("[reset-admin] Could not set custom DNS servers:", err);
}

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

  // Remove old super admins
  await AdminModel.deleteMany({});

  const ACCOUNTS = [
    { username: "admin@pec", password: "adminpec@123" },
    { username: "admin@pec.in", password: "adminds@123" },
    { username: "aidshod@pec.in", password: "hodpec@123" }
  ];

  for (const acc of ACCOUNTS) {
    const hashedPassword = await bcrypt.hash(acc.password, 10);
    const result = await AdminModel.create({
      username: acc.username,
      password: hashedPassword
    });
    console.log(`[reset-admin] ✅ Account ready: ${result.username}`);
  }

  console.log("\n✅ Admin and HOD accounts initialized successfully!");
  console.log("   Username: admin@pec      | Password: adminpec@123");
  console.log("   Username: admin@pec.in   | Password: adminds@123");
  console.log("   Username: aidshod@pec.in | Password: hodpec@123");
  await mongoose.disconnect();
  process.exit(0);
}

resetAdmins().catch(err => {
  console.error("[reset-admin] Error:", err);
  process.exit(1);
});
