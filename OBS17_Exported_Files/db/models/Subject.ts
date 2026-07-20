import mongoose, { Schema } from "mongoose";

const SubjectSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    code: { type: String, required: true }, // e.g., CS101
    name: { type: String, required: true }, // e.g., Introduction to Computer Science
    department: { type: String, required: true },
    credits: { type: Number, required: true },
    type: { type: String, enum: ["Theory", "Practical", "Both"], default: "Theory" },
    experimentCount: { type: Number, default: 12 }
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

export const SubjectModel = mongoose.models.Subject ?? mongoose.model("Subject", SubjectSchema);
