import mongoose from 'mongoose'

const departmentSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  nameHindi:   { type: String, default: '' },
  description: { type: String, default: '' },
  isActive:    { type: Boolean, default: true }
}, { timestamps: true })

departmentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Department', departmentSchema)
