import mongoose, { Schema } from "mongoose";

// Sub-schemas
const TimetableSlotSchema = new Schema(
  {
    day: { type: String, required: true },
    time: { type: String, required: true },
    lab: { type: String, required: true },
    batch: { type: String, required: true },
    room: { type: String, required: true },
  },
  { _id: false }
);

const FacultySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, default: null, select: false },
    department: { type: String, required: true },
    labName: { type: String, required: true },
    batch: { type: String, required: true },
    subjectsHandled: [{ type: String }],
    subjectName: { type: String, default: "" },
    subjectCode: { type: String, default: "" },
    experience: { type: String, default: "0 Years" },
    workloadHours: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 },
    timetable: [TimetableSlotSchema],
    profilePic: { type: String, default: "" },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: false },
    facultyAttendance: { type: Number, default: 100 },
    batchId: { type: String, default: "" },
    sectionId: { type: String, default: "" },
    assignedSectionIds: [{ type: String }],
    assignedSectionMappings: [
      {
        sectionId: { type: String },
        sectionName: { type: String },
        subjectName: { type: String },
        subjectCode: { type: String },
        labName: { type: String }
      }
    ],
    sections: { type: String, default: "" },
    labDay: { type: String, default: "" },
    labPeriod: { type: String, default: "" },
    labTime: { type: String, default: "" },
    timetableAnalyzedAt: { type: String, default: "" },
    timetableAnalyzedDay: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
    toObject: {
      transform(_doc: any, ret: any) {
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

export const FacultyModel =
  mongoose.models.Faculty ?? mongoose.model("Faculty", FacultySchema);
