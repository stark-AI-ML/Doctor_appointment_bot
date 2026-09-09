import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    department: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    nameHindi: { type: String, default: "" },
    phone: { type: String, default: "", required: false },
    role: { type: String, default: "" },
    qualification: { type: String, default: "" },
    qualificationHindi: { type: String, default: "" },
    displaySchedule: { type: String, default: "" },
    specialization: { type: String, required: true },
    specializationHindi: { type: String, default: "" },
    specialty: { type: String, default: "" },
    address: { type: String, default: "" },
    gender: { type: String, enum: ["male", "female", "other"] },
    consultationFee: { type: Number, default: 0 },
    experience: { type: mongoose.Schema.Types.Mixed, default: 0 },
    image: { type: String, default: "" },
    maxPatientsPerDay: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Clean JSON output: _id → id, drop __v, emit backward-compat aliases
doctorSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;

    // Canonical → backward-compat aliases (same data, no duplicates in DB)
    ret.qualifications = ret.qualification || "";
    ret.AOF = ret.specialty || "";
    ret.imageUrl = ret.image || "";
    ret.ImageUrl = ret.image || "";
    ret.consultation_fee = ret.consultationFee || 0;

    // Populate department from departmentId if available
    if (
      ret.departmentId &&
      typeof ret.departmentId === "object" &&
      ret.departmentId.name
    ) {
      ret.department = ret.departmentId.name;
    }

    return ret;
  },
});

export default mongoose.model("Doctor", doctorSchema);
