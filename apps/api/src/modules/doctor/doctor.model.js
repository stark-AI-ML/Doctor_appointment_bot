import mongoose from 'mongoose'

const doctorSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  specialization:   { type: String, required: true },
  address:          { type: String, default: '' },
  gender:           { type: String, enum: ['male', 'female', 'other'] },
  consultationFee:  { type: Number, default: 0 },
  experience:       { type: Number, default: 0 },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true })

// Clean JSON output: _id → id, drop __v
doctorSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Doctor', doctorSchema)
