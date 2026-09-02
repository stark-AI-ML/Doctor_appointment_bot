import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  duration:    { type: Number, default: 30 },    // minutes
  price:       { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
})

serviceSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Service', serviceSchema)
