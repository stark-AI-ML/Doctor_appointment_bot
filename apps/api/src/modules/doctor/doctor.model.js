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
    phone: { type: String, default: "", required: false },
    role: { type: String, default: "" },
    qualifications: { type: String, default: "" },
    qualification: { type: String, default: "" },
    displaySchedule: { type: String, default: "" },
    specialization: { type: String, required: true },
    specialty: { type: String, default: "" },
    address: { type: String, default: "" },
    gender: { type: String, enum: ["male", "female", "other"] },
    consultationFee: { type: Number, default: 0 },
    experience: { type: mongoose.Schema.Types.Mixed, default: 0 },
    AOF: { type: String, default: "" },
    ImageUrl: { type: String, default: "" },
    image: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Clean JSON output: _id → id, drop __v and provide dual-compatibility aliases
doctorSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;

    ret.role = ret.role || ret.specialization || "";
    ret.specialization = ret.specialization || ret.role || "";
    ret.qualification = ret.qualification || ret.qualifications || "";
    ret.qualifications = ret.qualifications || ret.qualification || "";
    ret.specialty = ret.specialty || ret.AOF || ret.specialization || "";
    ret.AOF = ret.AOF || ret.specialty || "";
    ret.image = ret.image || ret.ImageUrl || ret.imageUrl || "";
    ret.imageUrl = ret.imageUrl || ret.image || ret.ImageUrl || "";
    ret.ImageUrl = ret.ImageUrl || ret.imageUrl || ret.image || "";

    if (ret.departmentId && typeof ret.departmentId === "object" && ret.departmentId.name) {
      ret.department = ret.departmentId.name;
    }

    return ret;
  },
});

export default mongoose.model("Doctor", doctorSchema);
