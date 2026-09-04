import Patient from './patient.model.js'

class PatientRepository {
  async findByPhone(phone) {
    return Patient.findOne({ phone })
  }

  async findOrCreate(phone, data = {}) {
    let query = { phone }
    // If a specific name is provided (and it's not 'Unknown'), try to find that specific patient
    if (data.name && data.name !== 'Unknown') {
      // case-insensitive name match could be better, but exact match is fine for now
      let patient = await Patient.findOne({ phone, name: data.name })
      if (patient) return patient

      // If not found, check if there's an 'Unknown' placeholder we can update
      const unknownPatient = await Patient.findOne({ phone, name: 'Unknown' })
      if (unknownPatient) {
        return Patient.findByIdAndUpdate(unknownPatient._id, data, { new: true })
      }
    }

    // Default fallback (e.g., when data.name is 'Unknown' or not provided)
    let patient = await Patient.findOne(query)
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
