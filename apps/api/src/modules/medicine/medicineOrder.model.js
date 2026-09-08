import mongoose from 'mongoose'

const medicineOrderSchema = new mongoose.Schema({
  orderId:         { type: String, required: true, unique: true },
  patientId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  deliveryAddress: { type: String, required: true },
  prescriptionUrl: { type: String, required: true },
  customerNotes:   { type: String, default: '' },
  staffNotes:      { type: String, default: '' },
  status:          { type: String, enum: ['pending', 'processing', 'dispatched', 'completed', 'cancelled'], default: 'pending' },
  source:          { type: String, enum: ['whatsapp', 'admin'], default: 'whatsapp' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdByRole: { type: String, default: null },
}, { timestamps: true })

medicineOrderSchema.index({ status: 1 })
medicineOrderSchema.index({ patientId: 1 })
medicineOrderSchema.index({ createdAt: -1 })

medicineOrderSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('MedicineOrder', medicineOrderSchema)
