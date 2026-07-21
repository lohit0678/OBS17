import mongoose, { Schema, Document } from "mongoose";

export interface IAssignment extends Document {
  assignmentId: string;
  studentId: string;
  facultyId: string;
  subjectCode?: string;
  subjectName?: string;
  title: string;
  description?: string;
  dueDate: string;
  maxScore: number;
  status: 'Pending' | 'Submitted' | 'Graded';
  fileUrl?: string;
  submittedAt?: string;
  score?: number;
  remarks?: string;
  gradedAt?: string;
  gradedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    assignmentId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    facultyId: { type: String, required: true, index: true },
    subjectCode: { type: String, default: "" },
    subjectName: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    dueDate: { type: String, required: true },
    maxScore: { type: Number, default: 50 },
    status: { type: String, enum: ['Pending', 'Submitted', 'Graded'], default: 'Pending' },
    fileUrl: { type: String, default: "" },
    submittedAt: { type: String, default: "" },
    score: { type: Schema.Types.Mixed, default: 0 },
    remarks: { type: String, default: "" },
    gradedAt: { type: String, default: "" },
    gradedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound Unique Index: Per-faculty + per-student + per-assignment isolation
// Supports 50+ faculty members — each faculty's record evaluations are stored separately
AssignmentSchema.index(
  { studentId: 1, facultyId: 1, assignmentId: 1 },
  { unique: true }
);

if (mongoose.models.Assignment) {
  delete (mongoose.models as any).Assignment;
}
export const AssignmentModel = mongoose.model<IAssignment>("Assignment", AssignmentSchema, "assignments");
