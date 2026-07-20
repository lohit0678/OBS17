import mongoose, { Schema } from "mongoose";

// Represents a mapping for a specific day and period
const TimetableEntrySchema = new Schema(
  {
    day: { type: String, required: true },
    periodId: { type: String, required: true }, // Refers to the TimetableStructure period
    subjectId: { type: String, required: true },
    facultyId: { type: String, required: true },
    room: { type: String, default: "" },
  },
  { _id: false }
);

const SectionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    batchId: { type: String, required: true },
    name: { type: String, required: true }, // e.g., "Section A"
    timetableStructureId: { type: String, required: true }, // The dynamic structure to use
    timetable: [TimetableEntrySchema], // The actual assigned subjects/faculty
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const SectionModel = mongoose.models.Section ?? mongoose.model("Section", SectionSchema);
