import mongoose from 'mongoose'

// Atomic sequence counters for every human-facing ID.
// {_id: 'uhid:2026', seq: 41} — incremented via findOneAndUpdate $inc.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
})

export default mongoose.model('Counter', counterSchema)
