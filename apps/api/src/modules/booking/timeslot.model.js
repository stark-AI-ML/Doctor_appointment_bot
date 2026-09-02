import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // "10:00"
  endTime: { type: String, required: true }, // "11:00"
  isAvailable: { type: Boolean, default: true },
});

timeSlotSchema.index({ doctorId: 1, date: 1 });
timeSlotSchema.index({ doctorId: 1, date: 1, isAvailable: 1 });

timeSlotSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("TimeSlot", timeSlotSchema);
