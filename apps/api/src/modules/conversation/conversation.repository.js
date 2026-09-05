import ConversationState from './conversation.model.js'

class ConversationRepository {
  async findByPhone(phone) {
    return ConversationState.findOne({ phone })
  }

  async upsert(phone, data) {
    return ConversationState.findOneAndUpdate(
      { phone },
      { ...data, phone, lastUpdated: new Date() },
      { upsert: true, new: true }
    )
  }

  async resetState(phone) {
    return ConversationState.findOneAndUpdate(
      { phone },
      {
        currentStep: 'WELCOME',
        selectedDoctorId: null,
        selectedServiceId: null,
        selectedSlotId: null,
        selectedDate: null,
        tempName: null,
        tempAge: null,
        tempGender: null,
        stateData: {},
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    )
  }

  async deleteByPhone(phone) {
    return ConversationState.deleteOne({ phone })
  }
}

export default new ConversationRepository()
