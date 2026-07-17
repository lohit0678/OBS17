import mongoose, { Schema } from "mongoose";

// ---- Sub-schemas (no _id) ----
const LabExperimentSchema = new Schema(
  {
    id: String,
    name: String,
    dueDate: String,
    observationPdfUrl: String,
    recordPdfUrl: String,
    status: { type: String, default: "Not Submitted" },
    score: { type: Number, default: 0 },
    maxScore: Number,
    remarks: String,
    submittedAt: String,
  },
  { _id: false }
);

const AssignmentSchema = new Schema(
  {
    id: String,
    title: String,
    description: { type: String, default: "" },
    dueDate: String,
    fileUrl: String,
    status: { type: String, default: "Pending" },
    score: Number,
    maxScore: Number,
    remarks: String,
    submittedAt: String,
  },
  { _id: false }
);

const InternalMarksEntrySchema = new Schema(
  {
    cia1: { type: Number, default: 0 },
    cia2: { type: Number, default: 0 },
    cia3: { type: Number, default: 0 },
    practical: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
  },
  { _id: false }
);

const NotificationSchema = new Schema(
  {
    id: String,
    type: String,
    title: String,
    message: String,
    date: String,
    sender: String,
  },
  { _id: false }
);

const CalendarEventSchema = new Schema(
  {
    id: String,
    title: String,
    date: String,
    type: String,
    description: String,
  },
  { _id: false }
);

const CertificateSchema = new Schema(
  {
    id: String,
    title: String,
    issuer: String,
    date: String,
    type: String,
  },
  { _id: false }
);

const AttendanceHistorySchema = new Schema(
  {
    date: String,
    status: String,
  },
  { _id: false }
);

// ---- Main Student Schema ----
const StudentSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    facultyId: { type: String, required: true },
    facultyName: { type: String, required: true },
    attendance: { type: Number, default: 0 },
    subjectAttendance: { type: Schema.Types.Mixed, default: {} },
    attendanceHistory: [AttendanceHistorySchema],
    experiments: [LabExperimentSchema],
    assignments: [AssignmentSchema],
    internalMarks: { type: Schema.Types.Mixed, default: {} },
    notifications: [NotificationSchema],
    calendarEvents: [CalendarEventSchema],
    certificates: [CertificateSchema],
    batch: { type: String, required: true },
    labName: { type: String, required: true },
    registerNo: { type: String, required: true },
    rollNo: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: String, required: true },
    section: { type: String, required: true },
    phone: { type: String, default: "" },
    parentName: { type: String, default: "" },
    parentPhone: { type: String, default: "" },
    profilePic: { type: String, default: "" },
    riskFlagged: { type: Boolean, default: false },
    riskReason: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
    toObject: {
      transform(_doc: any, ret: any) {
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

export const StudentModel =
  mongoose.models.Student ?? mongoose.model("Student", StudentSchema);
