import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
  bookingId:     { type: String, required: true, unique: true },
  doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  serviceId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
  slotId:        { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
  status:        { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  bookingSource: { type: String, enum: ['whatsapp', 'admin', 'manual'], default: 'whatsapp' },
}, { timestamps: true })

bookingSchema.index({ doctorId: 1, status: 1 })
bookingSchema.index({ patientId: 1 })
bookingSchema.index({ createdAt: -1 })

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
