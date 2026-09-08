import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  bookingId:     { type: String, required: true, unique: true },
  tokenNumber:   { type: String, default: null },
  doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  departmentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  serviceId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
  slotId:        { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', default: null },
  preferredDate: { type: Date, default: null },
  problemDescription: { type: String, default: '' },
  type:          { type: String, enum: ['OPD', 'HOSPITALIZATION'], default: 'OPD' },
  status:        { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  bookingSource: { type: String, enum: ['whatsapp', 'admin', 'manual'], default: 'whatsapp' },
  // Who registered this booking. null = WhatsApp bot; user id = staff member.
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdByRole: { type: String, default: null },
}, { timestamps: true })

bookingSchema.index({ doctorId: 1, status: 1 })
bookingSchema.index({ patientId: 1 })
bookingSchema.index({ createdAt: -1 })
bookingSchema.index({ createdBy: 1, createdAt: -1 })

bookingSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Booking', bookingSchema)
