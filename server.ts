import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import { connectDB } from "./db/mongoose.js";
import { FacultyModel } from "./db/models/Faculty.js";
import { StudentModel } from "./db/models/Student.js";
import { AdminModel } from "./db/models/Admin.js";
import { authMiddleware, AuthRequest } from "./middleware/auth.js";

// ─── ESM / CJS __dirname compat ──────────────────────────────────────────────
let currentDirname = "";
try {
  if (typeof __filename !== "undefined" && __filename) {
    currentDirname = __dirname;
  } else {
    currentDirname = path.dirname(fileURLToPath(import.meta.url));
  }
} catch {
  currentDirname = process.cwd();
}

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT       = Number(process.env.PORT) || 3000;
const HOST       = process.env.HOST || "0.0.0.0";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_in_prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

// ─── Multer – disk storage for file uploads ───────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.join(currentDirname, "uploads"));
  },
  filename(_req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter(_req, file, cb) {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF, JPEG and PNG files are allowed"));
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function signToken(payload: { id: string; role: string; email: string; name: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any);
}

function recalcRisk(student: any): { attendance: number; riskFlagged: boolean; riskReason?: string } {
  const presentCount = (student.attendanceHistory as any[]).filter(
    (h) => h.status === "Present" || h.status === "On Duty"
  ).length;
  const totalCount = (student.attendanceHistory as any[]).length;
  const attendancePercent =
    totalCount > 0
      ? Math.round((presentCount / totalCount) * 100)
      : student.attendance;

  const approvedCount = (student.experiments as any[]).filter(
    (e) => e.status === "Approved"
  ).length;
  const labCompletionRate =
    (student.experiments as any[]).length > 0
      ? Math.round((approvedCount / (student.experiments as any[]).length) * 100)
      : 100;

  const riskFlagged = attendancePercent < 75 || labCompletionRate < 50;
  let riskReason: string | undefined;
  if (riskFlagged) {
    if (attendancePercent < 75 && labCompletionRate < 50) {
      riskReason = `Critical dual risk: Attendance at ${attendancePercent}% and Lab completion at ${labCompletionRate}%.`;
    } else if (attendancePercent < 75) {
      riskReason = `Attendance (${attendancePercent}%) below the mandatory 75% threshold.`;
    } else {
      riskReason = `Lab completion (${labCompletionRate}%) is below academic criteria.`;
    }
  }
  return { attendance: attendancePercent, riskFlagged, riskReason };
}

async function getAllStudents() {
  return (StudentModel as any).find({}).lean();
}

async function getAllFaculties() {
  return (FacultyModel as any).find({}).lean();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function startServer() {
  // 1. Connect to MongoDB
  await connectDB();

  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(currentDirname, "uploads")));

  // ─── Global error handler ─────────────────────────────────────────────────
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    console.error("[Server Error]", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  });

  // ===========================================================================
  // HEALTH
  // ===========================================================================
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "faculty-erp-backend", db: "mongodb" });
  });

  // ===========================================================================
  // AUTH: LOGIN
  // ===========================================================================
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
      const trimmedEmail = email.trim().toLowerCase();

      // HOD check via AdminModel
      const admin: any = await (AdminModel as any).findOne({ username: trimmedEmail }).lean();
      if (admin) {
        const stored = admin.password;
        const match = stored.startsWith("$2")
          ? await bcrypt.compare(password, stored)
          : password === stored;
        if (match) {
          const token = signToken({ id: "HOD01", role: "HOD", email: admin.username, name: "Dr. Rajesh Sharma" });
          return res.json({
            user: { isAuthenticated: true, token, role: "HOD", name: "Dr. Rajesh Sharma", email: admin.username, id: "HOD01", profilePic: "" },
          });
        }
      }

      // Faculty login
      const faculty: any = await (FacultyModel as any).findOne({ email: trimmedEmail }).select("+password").lean();
      if (faculty) {
        if (!faculty.isActive) {
          return res.status(403).json({ error: "Your account is not activated. Please register to activate your account." });
        }
        const stored: string = faculty.password || "password";
        const match = stored.startsWith("$2")
          ? await bcrypt.compare(password, stored)
          : password === stored;
        if (match) {
          const token = signToken({ id: faculty.id, role: "Faculty", email: faculty.email, name: faculty.name });
          return res.json({
            user: { isAuthenticated: true, token, role: "Faculty", name: faculty.name, email: faculty.email, id: faculty.id, profilePic: faculty.profilePic || "" },
          });
        }
      }

      // Student login (default password: "password")
      const student: any = await (StudentModel as any).findOne({ email: trimmedEmail }).lean();
      if (student && password === "password") {
        const token = signToken({ id: student.id, role: "Student", email: student.email, name: student.name });
        return res.json({
          user: { isAuthenticated: true, token, role: "Student", name: student.name, email: student.email, id: student.id, profilePic: student.profilePic || "" },
        });
      }

      return res.status(401).json({ error: "Invalid email or password" });
    } catch (err: any) {
      console.error("[Login Error]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===========================================================================
  // AUTH: REGISTER FACULTY
  // ===========================================================================
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });
      const trimmedEmail = email.trim().toLowerCase();

      const exists = await (FacultyModel as any).findOne({ email: trimmedEmail });
      if (!exists) {
        return res.status(400).json({ error: "Your email is not pre-approved by the HOD. Please contact HOD to gain access." });
      }
      if (exists.isActive) {
        return res.status(400).json({ error: "Faculty with this email is already registered." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      exists.name = name.trim();
      exists.password = hashedPassword;
      exists.isActive = true;
      await exists.save();

      const token = signToken({ id: exists.id, role: "Faculty", email: exists.email, name: exists.name });
      return res.json({
        success: true,
        user: { isAuthenticated: true, token, role: "Faculty", name: exists.name, email: exists.email, id: exists.id, profilePic: exists.profilePic || "" },
      });
    } catch (err: any) {
      console.error("[Register Error]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===========================================================================
  // AUTH: GOOGLE SIGN-IN
  // ===========================================================================
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential } = req.body;
      if (!credential) return res.status(400).json({ error: "Google credential is required" });

      const parts = credential.split(".");
      if (parts.length !== 3) return res.status(400).json({ error: "Invalid Google token format" });

      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      const { email, name, picture } = payload;
      if (!email) return res.status(400).json({ error: "Google token has no email address" });
      const trimmedEmail = email.trim().toLowerCase();

      let faculty: any = await (FacultyModel as any).findOne({ email: trimmedEmail });
      if (!faculty) {
        return res.status(400).json({ error: "Your Google email is not pre-approved by the HOD. Please contact HOD to gain access." });
      }

      if (!faculty.isActive) {
        faculty.name = name || faculty.name || "Google Faculty Member";
        faculty.profilePic = picture || "";
        faculty.isActive = true;
        faculty.password = await bcrypt.hash("google_oauth_no_password_" + Math.random().toString(36), 10);
        await faculty.save();
      } else {
        if (!faculty.profilePic && picture) {
          faculty.profilePic = picture;
          await faculty.save();
        }
      }

      const token = signToken({ id: faculty.id, role: "Faculty", email: faculty.email, name: faculty.name });
      return res.json({
        user: { isAuthenticated: true, token, role: "Faculty", name: faculty.name, email: faculty.email, id: faculty.id, profilePic: faculty.profilePic || "" },
      });
    } catch (err: any) {
      console.error("[Google Auth Error]", err);
      res.status(400).json({ error: "Failed to authenticate Google credentials." });
    }
  });

  // ===========================================================================
  // FILE UPLOAD
  // ===========================================================================
  app.post("/api/upload", authMiddleware, upload.single("file"), (req: AuthRequest, res: Response) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, fileUrl, originalName: req.file.originalname });
  });

  // ===========================================================================
  // GEMINI AI QUERY
  // ===========================================================================
  app.post("/api/ai/query", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (!GEMINI_KEY) return res.status(503).json({ error: "Gemini AI not configured. Set GEMINI_API_KEY in .env" });
      const { prompt, context } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt is required" });

      const genai = new GoogleGenAI({ apiKey: GEMINI_KEY });
      const systemCtx = `You are an academic ERP assistant for a college Lab Management System. Help faculty and students with academic queries, lab experiments, and educational support. Context: ${context || "General academic query"}`;

      const result = await genai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: `${systemCtx}\n\nQuery: ${prompt}` }] }],
      });

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
      res.json({ success: true, response: text });
    } catch (err: any) {
      console.error("[Gemini AI Error]", err);
      res.status(500).json({ error: err.message || "AI query failed" });
    }
  });

  // ===========================================================================
  // ACADEMIC: FETCH ALL DATA
  // ===========================================================================
  app.get("/api/academic/data", authMiddleware, async (_req, res) => {
    try {
      const [faculties, students] = await Promise.all([getAllFaculties(), getAllStudents()]);
      res.json({ faculties, students });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch academic data" });
    }
  });

  // ===========================================================================
  // ACADEMIC: ALL STUDENTS (HOD view)
  // ===========================================================================
  app.get("/api/academic/students", authMiddleware, async (_req, res) => {
    try {
      const students = await getAllStudents();
      res.json({ students });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // ===========================================================================
  // ACADEMIC: DEPARTMENT STATS
  // ===========================================================================
  app.get("/api/academic/stats", authMiddleware, async (_req, res) => {
    try {
      const [faculties, students]: [any[], any[]] = await Promise.all([getAllFaculties(), getAllStudents()]);
      const totalStudents = students.length;
      const riskStudents = students.filter((s) => s.riskFlagged).length;
      const avgAttendance = totalStudents > 0
        ? Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / totalStudents) : 0;
      const submittedLabs = students.reduce((c, s) => c + (s.experiments || []).filter((e: any) => e.status !== "Not Submitted").length, 0);
      const totalLabs = students.reduce((c, s) => c + (s.experiments || []).length, 0);

      // Calculate batch attendance
      const batchGroups: Record<string, { sum: number; count: number }> = {};
      students.forEach((s) => {
        const b = s.batch || "General";
        if (!batchGroups[b]) {
          batchGroups[b] = { sum: 0, count: 0 };
        }
        batchGroups[b].sum += s.attendance || 0;
        batchGroups[b].count += 1;
      });
      const batchAttendance: Record<string, number> = {};
      Object.keys(batchGroups).forEach((b) => {
        batchAttendance[b] = Math.round(batchGroups[b].sum / batchGroups[b].count);
      });

      res.json({
        totalStudents,
        totalFaculties: faculties.length,
        activeFaculties: faculties.filter((f) => f.isActive).length,
        riskStudents,
        avgAttendance,
        submittedLabs,
        totalLabs,
        labCompletionRate: totalLabs > 0 ? Math.round((submittedLabs / totalLabs) * 100) : 0,
        batchAttendance,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ===========================================================================
  // HOD: ADD PRE-APPROVED FACULTY
  // ===========================================================================
  app.post("/api/hod/faculty", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== "HOD") {
        return res.status(403).json({ error: "Unauthorized. Only HOD can perform this action." });
      }
      const { email, phone, labName, subject, subjectCode, batch, sections } = req.body;
      if (!email || !labName || !subject || !subjectCode || !batch || !sections) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const trimmedEmail = email.trim().toLowerCase();

      const exists = await (FacultyModel as any).findOne({ email: trimmedEmail });
      if (exists) {
        return res.status(400).json({ error: "Faculty member with this email is already added or registered." });
      }

      const count = await (FacultyModel as any).countDocuments();
      const nextId = "F" + String(count + 1).padStart(2, "0");

      const sectionsArray = typeof sections === "string"
        ? sections.split(",").map((s: string) => s.trim()).filter(Boolean)
        : sections;

      const timetableSlots = sectionsArray.map((sec: string, idx: number) => {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const day = days[idx % days.length];
        return {
          day,
          time: "09:00 AM - 11:00 AM",
          lab: labName,
          batch: sec,
          room: `Lab ${idx + 1}`
        };
      });

      const newFaculty = await (FacultyModel as any).create({
        id: nextId,
        name: `Pending Registration (${trimmedEmail.split('@')[0]})`,
        email: trimmedEmail,
        password: "pending_registration_password",
        department: "Artificial Intelligence & Data Science",
        labName,
        batch,
        subjectsHandled: [subject],
        subjectCode,
        experience: "0 Years",
        workloadHours: sectionsArray.length * 2,
        performanceScore: 100,
        timetable: timetableSlots,
        profilePic: "",
        phone: phone || "",
        isActive: false,
        facultyAttendance: 100,
      });

      res.json({ success: true, faculty: newFaculty, faculties: await getAllFaculties() });
    } catch (err: any) {
      console.error("[HOD Create Faculty Error]", err);
      res.status(500).json({ error: err.message || "Failed to create faculty pre-approval record" });
    }
  });

  // ===========================================================================
  // HOD: UPDATE ADMIN PASSWORD
  // ===========================================================================
  app.post("/api/admin/password", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.role !== "HOD") {
        return res.status(403).json({ error: "Unauthorized. Only HOD can change credentials." });
      }
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: "Old and new passwords are required" });
      }

      const admin: any = await (AdminModel as any).findOne({ username: req.user.email });
      if (!admin) {
        return res.status(404).json({ error: "Admin account not found" });
      }

      const match = admin.password.startsWith("$2")
        ? await bcrypt.compare(oldPassword, admin.password)
        : oldPassword === admin.password;

      if (!match) {
        return res.status(400).json({ error: "Incorrect current password" });
      }

      admin.password = await bcrypt.hash(newPassword, 10);
      await admin.save();

      res.json({ success: true, message: "Password updated successfully" });
    } catch (err: any) {
      console.error("[Change Password Error]", err);
      res.status(500).json({ error: err.message || "Failed to update password" });
    }
  });

  // ===========================================================================
  // ACADEMIC: SINGLE FACULTY
  // ===========================================================================
  app.get("/api/academic/faculty/:facultyId", authMiddleware, async (req, res) => {
    try {
      const faculty = await (FacultyModel as any).findOne({ id: req.params.facultyId }).lean();
      if (!faculty) return res.status(404).json({ error: "Faculty not found" });
      res.json({ faculty });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch faculty" });
    }
  });

  // ===========================================================================
  // ACADEMIC: UPDATE FACULTY PROFILE
  // ===========================================================================
  app.put("/api/academic/faculty/:facultyId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { facultyId } = req.params;
      if (req.user?.role === "Faculty" && req.user.id !== facultyId) {
        return res.status(403).json({ error: "You can only update your own profile" });
      }
      const updates = { ...req.body };
      delete updates.id; delete updates.password; delete updates.email;
      const faculty = await (FacultyModel as any).findOneAndUpdate({ id: facultyId }, { $set: updates }, { new: true }).lean();
      if (!faculty) return res.status(404).json({ error: "Faculty not found" });
      res.json({ success: true, faculty });
    } catch (err) {
      res.status(500).json({ error: "Failed to update faculty" });
    }
  });

  // ===========================================================================
  // ACADEMIC: UPDATE PROFILE PICTURE
  // ===========================================================================
  app.post("/api/academic/faculty/profile-pic", authMiddleware, async (_req, res) => {
    try {
      const { facultyId, profilePic } = _req.body;
      if (!facultyId || !profilePic) return res.status(400).json({ error: "Missing facultyId or profilePic" });
      await (FacultyModel as any).updateOne({ id: facultyId }, { $set: { profilePic } });
      const faculties = await getAllFaculties();
      res.json({ success: true, faculties });
    } catch (err) {
      res.status(500).json({ error: "Failed to update profile picture" });
    }
  });

  // ===========================================================================
  // ACADEMIC: FACULTY'S STUDENTS
  // ===========================================================================
  app.get("/api/academic/faculty/:facultyId/students", authMiddleware, async (req, res) => {
    try {
      const students = await (StudentModel as any).find({ facultyId: req.params.facultyId }).lean();
      res.json({ students });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // ===========================================================================
  // ACADEMIC: MARK ATTENDANCE
  // ===========================================================================
  app.post("/api/academic/attendance", authMiddleware, async (req, res) => {
    try {
      const { studentId, date, status } = req.body;
      if (!studentId || !date || !status) return res.status(400).json({ error: "Missing required parameters" });

      const student: any = await (StudentModel as any).findOne({ id: studentId });
      if (!student) return res.status(404).json({ error: "Student not found" });

      const idx = student.attendanceHistory.findIndex((h: any) => h.date === date);
      if (idx >= 0) student.attendanceHistory[idx] = { date, status };
      else student.attendanceHistory.push({ date, status });

      const risk = recalcRisk(student);
      student.attendance = risk.attendance;
      student.riskFlagged = risk.riskFlagged;
      student.riskReason = risk.riskReason;
      student.markModified("attendanceHistory");
      await student.save();

      res.json({ success: true, students: await getAllStudents() });
    } catch (err) {
      res.status(500).json({ error: "Failed to update attendance" });
    }
  });

  // ===========================================================================
  // ACADEMIC: SUBMIT LAB EXPERIMENT
  // ===========================================================================
  app.post("/api/academic/lab/submit", authMiddleware, async (req, res) => {
    try {
      const { studentId, experimentId, observationFile, recordFile } = req.body;
      if (!studentId || !experimentId) return res.status(400).json({ error: "Missing studentId or experimentId" });

      const student: any = await (StudentModel as any).findOne({ id: studentId });
      if (!student) return res.status(404).json({ error: "Student not found" });

      const idx = student.experiments.findIndex((e: any) => e.id === experimentId);
      const today = new Date().toISOString().split("T")[0];
      if (idx >= 0) {
        student.experiments[idx].status = "Submitted - Pending";
        student.experiments[idx].observationPdfUrl = observationFile || student.experiments[idx].observationPdfUrl || "uploaded_observation.pdf";
        student.experiments[idx].recordPdfUrl = recordFile || student.experiments[idx].recordPdfUrl || "uploaded_record.pdf";
        student.experiments[idx].submittedAt = today;
      }
      student.markModified("experiments");
      await student.save();

      res.json({ success: true, students: await getAllStudents() });
    } catch (err) {
      res.status(500).json({ error: "Failed to submit lab experiment" });
    }
  });

  // ===========================================================================
  // ACADEMIC: UPDATE LAB SUBMISSION STATUS
  // ===========================================================================
  app.post("/api/academic/lab/status", authMiddleware, async (req, res) => {
    try {
      const { studentId, experimentId, status, score, remarks } = req.body;
      if (!studentId || !experimentId || !status) return res.status(400).json({ error: "Missing required fields" });

      const student: any = await (StudentModel as any).findOne({ id: studentId });
      if (!student) return res.status(404).json({ error: "Student not found" });

      const idx = student.experiments.findIndex((e: any) => e.id === experimentId);
      if (idx >= 0) {
        student.experiments[idx].status = status;
        student.experiments[idx].score = status === "Approved" ? Number(score) : 0;
        if (remarks !== undefined) student.experiments[idx].remarks = remarks;
        student.markModified("experiments");
      }

      const approved = student.experiments.filter((e: any) => e.status === "Approved").length;
      const labRate = student.experiments.length > 0 ? Math.round((approved / student.experiments.length) * 100) : 100;
      const riskFlagged = student.attendance < 75 || labRate < 50;
      student.riskFlagged = riskFlagged;
      student.riskReason = riskFlagged
        ? (student.attendance < 75 && labRate < 50
          ? `Critical dual risk: Attendance at ${student.attendance}% and Lab completion at ${labRate}%.`
          : student.attendance < 75
            ? `Attendance (${student.attendance}%) below 75% threshold.`
            : `Lab completion (${labRate}%) is below academic criteria.`)
        : undefined;

      await student.save();
      res.json({ success: true, students: await getAllStudents() });
    } catch (err) {
      res.status(500).json({ error: "Failed to update lab status" });
    }
  });

  // ===========================================================================
  // ACADEMIC: DIRECT EVALUATION
  // ===========================================================================
  app.post("/api/academic/evaluation/direct", authMiddleware, async (req, res) => {
    try {
      const { studentId, experimentIndex, action } = req.body;
      if (!studentId || experimentIndex === undefined || !action) return res.status(400).json({ error: "Missing required fields" });

      const expId = `exp-${experimentIndex}`;
      const asgId = `asg-${experimentIndex}`;
      const today = new Date().toISOString().split("T")[0];

      const student: any = await (StudentModel as any).findOne({ id: studentId });
      if (!student) return res.status(404).json({ error: "Student not found" });

      if (action === "observation_only" || action === "both") {
        const expIdx = student.experiments.findIndex((e: any) => e.id === expId);
        if (expIdx >= 0) {
          student.experiments[expIdx].status = "Approved";
          student.experiments[expIdx].score = 10;
          student.experiments[expIdx].submittedAt = student.experiments[expIdx].submittedAt || today;
          student.experiments[expIdx].remarks = student.experiments[expIdx].remarks || "Observation Verified";
        } else {
          student.experiments.push({ id: expId, name: `Experiment ${experimentIndex}`, dueDate: today, status: "Approved", score: 10, maxScore: 10, submittedAt: today, remarks: "Observation Verified", observationPdfUrl: "uploaded_observation.pdf", recordPdfUrl: "uploaded_record.pdf" });
        }
        student.markModified("experiments");
      }

      if (action === "both" || action === "record_only") {
        const asgIdx = student.assignments.findIndex((a: any) => a.id === asgId);
        if (asgIdx >= 0) {
          student.assignments[asgIdx].status = "Graded";
          student.assignments[asgIdx].score = 10;
          student.assignments[asgIdx].submittedAt = student.assignments[asgIdx].submittedAt || today;
          student.assignments[asgIdx].remarks = student.assignments[asgIdx].remarks || "Record Graded";
        } else {
          student.assignments.push({ id: asgId, title: `Experiment ${experimentIndex} Record`, description: `Record notebook for Experiment ${experimentIndex}`, dueDate: today, status: "Graded", maxScore: 10, score: 10, submittedAt: today, remarks: "Record Graded", fileUrl: "uploaded_record.pdf" });
        }
        student.markModified("assignments");
      }

      const approved = student.experiments.filter((e: any) => e.status === "Approved").length;
      const labRate = student.experiments.length > 0 ? Math.round((approved / student.experiments.length) * 100) : 100;
      student.riskFlagged = student.attendance < 75 || labRate < 50;
      student.riskReason = student.riskFlagged
        ? (student.attendance < 75 && labRate < 50 ? `Critical dual risk: Attendance ${student.attendance}% and Lab ${labRate}%.`
          : student.attendance < 75 ? `Attendance (${student.attendance}%) below 75%.`
            : `Lab completion (${labRate}%) below criteria.`)
        : undefined;

      await student.save();
      res.json({ success: true, students: await getAllStudents() });
    } catch (err) {
      res.status(500).json({ error: "Failed to direct evaluate" });
    }
  });

  // ===========================================================================
  // ACADEMIC: SUBMIT ASSIGNMENT
  // ===========================================================================
  app.post("/api/academic/assignment/submit", authMiddleware, async (req, res) => {
    try {
      const { studentId, assignmentId, filename } = req.body;
      if (!studentId || !assignmentId || !filename) return res.status(400).json({ error: "Missing required parameters" });

      const student: any = await (StudentModel as any).findOne({ id: studentId });
      if (!student) return res.status(404).json({ error: "Student not found" });

      const idx = student.assignments.findIndex((a: any) => a.id === assignmentId);
      if (idx >= 0) {
        student.assignments[idx].status = "Submitted";
        student.assignments[idx].fileUrl = filename;
        student.assignments[idx].submittedAt = new Date().toISOString().split("T")[0];
        student.markModified("assignments");
      }
      await student.save();
      res.json({ success: true, students: await getAllStudents() });
    } catch (err) {
      res.status(500).json({ error: "Failed to submit assignment" });
    }
  });

  // ===========================================================================
  // ACADEMIC: GRADE ASSIGNMENT
  // ===========================================================================
  app.post("/api/academic/assignment/grade", authMiddleware, async (req, res) => {
    try {
      const { studentId, assignmentId, score, remarks } = req.body;
      if (!studentId || !assignmentId || score === undefined) return res.status(400).json({ error: "Missing required parameters" });

      const student: any = await (StudentModel as any).findOne({ id: studentId });
      if (!student) return res.status(404).json({ error: "Student not found" });

      const idx = student.assignments.findIndex((a: any) => a.id === assignmentId);
      if (idx >= 0) {
        student.assignments[idx].status = "Graded";
        student.assignments[idx].score = Number(score);
        student.assignments[idx].remarks = remarks || "";
        student.markModified("assignments");
      }
      await student.save();
      res.json({ success: true, students: await getAllStudents() });
    } catch (err) {
      res.status(500).json({ error: "Failed to grade assignment" });
    }
  });

  // ===========================================================================
  // ACADEMIC: CREATE ASSIGNMENT
  // ===========================================================================
  app.post("/api/academic/assignment/create", authMiddleware, async (req, res) => {
    try {
      const { facultyId, title, description, dueDate, maxScore, batch } = req.body;
      if (!facultyId || !title || !dueDate || !maxScore || !batch) return res.status(400).json({ error: "Missing required parameters" });

      const filter: Record<string, any> = { facultyId };
      if (batch !== "All Batches") filter.batch = batch;

      const newAsg = { id: `asg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, title, description, dueDate, status: "Pending", maxScore: Number(maxScore) };
      const newEvt = { id: `evt-${Date.now()}`, title: `Assignment Due: ${title}`, date: dueDate, type: "deadline", description };

      await (StudentModel as any).updateMany(filter, { $push: { assignments: { $each: [newAsg], $position: 0 }, calendarEvents: { $each: [newEvt], $position: 0 } } });
      res.json({ success: true, students: await getAllStudents() });
    } catch (err) {
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  // ===========================================================================
  // ACADEMIC: UPDATE INTERNAL MARKS
  // ===========================================================================
  app.post("/api/academic/internal-marks", authMiddleware, async (req, res) => {
    try {
      const { studentId, subject, cia1, cia2, cia3, practical } = req.body;
      if (!studentId || !subject) return res.status(400).json({ error: "Missing studentId or subject" });

      const c1 = Number(cia1 || 0), c2 = Number(cia2 || 0), c3 = Number(cia3 || 0), prac = Number(practical || 0);
      const average = Math.round(((c1 + c2 + c3) / 150) * 50 + (prac / 100) * 50);

      await (StudentModel as any).updateOne({ id: studentId }, { $set: { [`internalMarks.${subject}`]: { cia1: c1, cia2: c2, cia3: c3, practical: prac, average } } });
      res.json({ success: true, students: await getAllStudents() });
    } catch (err) {
      res.status(500).json({ error: "Failed to update internal marks" });
    }
  });

  // ===========================================================================
  // ACADEMIC: UPDATE STUDENT RISK
  // ===========================================================================
  app.post("/api/academic/student/risk", authMiddleware, async (req, res) => {
    try {
      const { studentId, riskFlagged, riskReason } = req.body;
      if (!studentId) return res.status(400).json({ error: "Missing studentId" });

      await (StudentModel as any).updateOne(
        { id: studentId },
        { $set: { riskFlagged: !!riskFlagged, riskReason: riskFlagged ? (riskReason || "Flagged for manual academic concern by faculty supervisor.") : undefined } }
      );
      res.json({ success: true, students: await getAllStudents() });
    } catch (err) {
      res.status(500).json({ error: "Failed to update student risk" });
    }
  });

  // ===========================================================================
  // ACADEMIC: SEND NOTIFICATIONS
  // ===========================================================================
  app.post("/api/academic/notifications", authMiddleware, async (req, res) => {
    try {
      const { type, title, message, sender, targetBatch } = req.body;
      if (!type || !title || !message || !sender) return res.status(400).json({ error: "Missing required parameters" });

      const filter: Record<string, any> = {};
      if (targetBatch && targetBatch !== "All Batches") filter.batch = targetBatch;

      const newNotif = { id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, type, title, message, date: new Date().toISOString().split("T")[0], sender };
      await (StudentModel as any).updateMany(filter, { $push: { notifications: { $each: [newNotif], $position: 0 } } });
      res.json({ success: true, students: await getAllStudents() });
    } catch (err) {
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // ===========================================================================
  // VITE MIDDLEWARE & FRONTEND ROUTING
  // ===========================================================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Fullstack Server] Running at http://${HOST}:${PORT}`);
  });
}

startServer();
