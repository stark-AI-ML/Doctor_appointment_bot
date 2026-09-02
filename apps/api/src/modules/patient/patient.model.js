import mongoose from 'mongoose'

const patientSchema = new mongoose.Schema({
  phone:     { type: String, required: true, unique: true },
  name:      { type: String, required: true, trim: true },
  age:       { type: Number, default: null },
  gender:    { type: String, enum: ['male', 'female', 'other'], default: null },
  address:   { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
})

patientSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Patient', patientSchema)
