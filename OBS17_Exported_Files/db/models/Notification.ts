import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  id: string;
  type: 'announcement' | 'circular' | 'schedule' | 'deadline' | 'exam';
  title: string;
  message: string;
  sender: string;
  senderRole?: string;
  targetBatch?: string;
  targetSectionId?: string;
  targetStudentId?: string;
  date: string;
  readBy: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['announcement', 'circular', 'schedule', 'deadline', 'exam'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    sender: { type: String, required: true },
    senderRole: { type: String, default: "" },
    targetBatch: { type: String, default: "" },
    targetSectionId: { type: String, default: "" },
    targetStudentId: { type: String, default: "" },
    date: { type: String, required: true },
    readBy: [{ type: String }],
  },
  { timestamps: true }
);

export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema, "notifications");
