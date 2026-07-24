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
    score: { type: Schema.Types.Mixed, default: 0 },
    maxScore: Number,
    remarks: String,
    submittedAt: String,
    submittedAtTime: String,
    isLateFacultySubmission: { type: Boolean, default: false },
    facultySubmissionTimingStatus: { type: String, default: "On-Time" },
    subjectCode: String,
    subjectName: String,
    experimentNumber: Number,
    facultyId: String,
    signedOffBy: String
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
    score: { type: Schema.Types.Mixed, default: 0 },
    maxScore: Number,
    remarks: String,
    submittedAt: String,
    subjectCode: String,
    subjectName: String,
    experimentNumber: Number,
    facultyId: String,
    gradedBy: String
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
    subjectCode: { type: String, default: "" },
    subjectName: { type: String, default: "" },
    facultyId: { type: String, default: "" },
    facultyEmail: { type: String, default: "" },
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
    batchId: { type: String, default: "" },
    sectionId: { type: String, default: "" },
    batch: { type: String, required: true },
    labName: { type: String, required: true },
    subjectCode: { type: String, default: "" },
    subjectName: { type: String, default: "" },
    registerNo: { type: String, required: true },
    rollNo: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: String, required: true },
    year: { type: String, default: "II" },
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
    versionKey: false,
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

if (mongoose.models.Student) {
  delete (mongoose.models as any).Student;
}
export const StudentModel = mongoose.model("Student", StudentSchema);
