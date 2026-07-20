import mongoose, { Schema } from "mongoose";

// A period can be a regular class or a break/lunch
const PeriodSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true }, // e.g., "Period 1", "Break", "Lunch"
    startTime: { type: String, required: true }, // e.g., "09:00 AM"
    endTime: { type: String, required: true }, // e.g., "10:00 AM"
    isBreak: { type: Boolean, default: false },
  },
  { _id: false }
);

const TimetableStructureSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true }, // e.g., "Standard CSE Structure"
    department: { type: String, required: true },
    days: [{ type: String }], // e.g., ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods: [PeriodSchema],
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

export const TimetableStructureModel = mongoose.models.TimetableStructure ?? mongoose.model("TimetableStructure", TimetableStructureSchema);
