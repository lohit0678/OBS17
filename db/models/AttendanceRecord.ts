import mongoose, { Schema, Document } from "mongoose";

export interface IAttendanceRecord extends Document {
  studentId: string;
  facultyId: string;
  facultyEmail?: string;
  date: string;
  subjectCode?: string;
  subjectName?: string;
  status: 'Present' | 'Absent' | 'On Duty';
  sectionId?: string;
  batchId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    studentId: { type: String, required: true, index: true },
    facultyId: { type: String, required: true, index: true },
    facultyEmail: { type: String, default: "" },
    date: { type: String, required: true, index: true },
    subjectCode: { type: String, default: "" },
    subjectName: { type: String, default: "" },
    status: { type: String, enum: ['Present', 'Absent', 'On Duty'], required: true },
    sectionId: { type: String, default: "" },
    batchId: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound Unique Index: Permanent protection against cross-faculty bleed
AttendanceRecordSchema.index(
  { studentId: 1, facultyId: 1, date: 1, subjectCode: 1 },
  { unique: true }
);

export const AttendanceRecordModel =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord>("AttendanceRecord", AttendanceRecordSchema, "attendance_records");
