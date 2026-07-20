import mongoose, { Schema, Document } from "mongoose";

export interface ILabExperiment extends Document {
  studentId: string;
  facultyId: string;
  subjectCode?: string;
  subjectName?: string;
  experimentNumber: number;
  name: string;
  dueDate: string;
  status: 'Not Submitted' | 'Submitted - Pending' | 'Approved' | 'Rejected';
  score: number;
  remarks?: string;
  observationSignoff: 'none' | 'tick' | 'cross';
  recordSignoff: 'none' | 'tick' | 'cross';
  observationPdfUrl?: string;
  recordPdfUrl?: string;
  submittedAt?: string;
  signedOffAt?: string;
  signedOffBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const LabExperimentSchema = new Schema<ILabExperiment>(
  {
    studentId: { type: String, required: true, index: true },
    facultyId: { type: String, required: true, index: true },
    subjectCode: { type: String, default: "" },
    subjectName: { type: String, default: "" },
    experimentNumber: { type: Number, required: true },
    name: { type: String, required: true },
    dueDate: { type: String, default: "" },
    status: {
      type: String,
      enum: ['Not Submitted', 'Submitted - Pending', 'Approved', 'Rejected'],
      default: 'Not Submitted',
    },
    score: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
    observationSignoff: { type: String, enum: ['none', 'tick', 'cross'], default: 'none' },
    recordSignoff: { type: String, enum: ['none', 'tick', 'cross'], default: 'none' },
    observationPdfUrl: { type: String, default: "" },
    recordPdfUrl: { type: String, default: "" },
    submittedAt: { type: String, default: "" },
    signedOffAt: { type: String, default: "" },
    signedOffBy: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound Unique Index: Per-faculty + per-subject + per-experiment isolation
// Supports 50+ faculty members — each faculty's signoffs are stored completely separately
LabExperimentSchema.index(
  { studentId: 1, facultyId: 1, subjectCode: 1, experimentNumber: 1 },
  { unique: true }
);

export const LabExperimentModel =
  mongoose.models.LabExperiment ||
  mongoose.model<ILabExperiment>("LabExperiment", LabExperimentSchema, "lab_experiments");
