import mongoose, { Schema } from "mongoose";

const AdminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: "Dr. Rajesh Sharma" },
  },
  { timestamps: true }
);

export const AdminModel = mongoose.models.Admin ?? mongoose.model("Admin", AdminSchema);
