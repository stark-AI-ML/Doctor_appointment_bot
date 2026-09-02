import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['superadmin', 'admin', 'staff'], default: 'admin' },
  isActive:     { type: Boolean, default: true },
  createdAt:    { type: Date, default: Date.now },
})

adminSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    delete ret.passwordHash // never expose
    return ret
  },
})

export default mongoose.model('Admin', adminSchema)
