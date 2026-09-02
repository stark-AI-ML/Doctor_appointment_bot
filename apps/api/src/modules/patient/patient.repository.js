import Patient from './patient.model.js'

class PatientRepository {
  async findByPhone(phone) {
    return Patient.findOne({ phone })
  }

  async findOrCreate(phone, data = {}) {
    let patient = await Patient.findOne({ phone })
    if (!patient) {
      patient = await Patient.create({ phone, ...data })
    }
    return patient
  }

  async findById(id) {
    return Patient.findById(id)
  }

  async search(query) {
    if (!query) return Patient.find().sort({ createdAt: -1 }).limit(50)
    const regex = new RegExp(query, 'i')
    return Patient.find({
      $or: [{ name: regex }, { phone: regex }],
    }).sort({ createdAt: -1 })
  }

  async update(id, data) {
    return Patient.findByIdAndUpdate(id, data, { new: true })
  }

  async countAll() {
    return Patient.countDocuments()
  }
}

export default new PatientRepository()
