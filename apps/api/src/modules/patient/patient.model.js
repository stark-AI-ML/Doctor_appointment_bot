import mongoose from 'mongoose'

const patientSchema = new mongoose.Schema({
  phone:     { type: String, required: true }, // Removed unique: true to allow family bookings from one WhatsApp number
  uhid:      { type: String, unique: true, sparse: true },
  primaryPhone: { type: String, default: '' },
  name:      { type: String, required: true, trim: true },
  age:       { type: Number, default: null },
  gender:    { type: String, enum: ['male', 'female', 'other'], default: null },
  district:  { type: String, default: '' },
  address:   { type: String, default: '' },
  pinCode:   { type: String, default: '' },
  isRegistered: { type: Boolean, default: false },
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
