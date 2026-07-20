import mongoose, { Schema } from "mongoose";

const BatchSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true }, // e.g., B.Tech AI&DS 2024-2028
    year: { type: String, required: true },
    department: { type: String, required: true },
    isActive: { type: Boolean, default: true },
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

export const BatchModel = mongoose.models.Batch ?? mongoose.model("Batch", BatchSchema);
