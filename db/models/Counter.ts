import mongoose, { Schema } from "mongoose";

export interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const CounterModel =
  mongoose.models.Counter ||
  mongoose.model("Counter", CounterSchema, "counters");

export async function getNextSequenceValue(sequenceName: string): Promise<number> {
  const sequenceDocument: any = await (CounterModel as any).findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return sequenceDocument.seq;
}
