import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
  phone:             { type: String, required: true, unique: true },
  currentStep:       { type: String, default: 'WELCOME' },
  selectedDoctorId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  selectedServiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
  selectedSlotId:    { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', default: null },
  selectedDate:      { type: String, default: null },
  tempName:          { type: String, default: null },
  tempAge:           { type: Number, default: null },
  tempGender:        { type: String, default: null },
  lastUpdated:       { type: Date, default: Date.now },
})

export default mongoose.model('ConversationState', conversationSchema)
