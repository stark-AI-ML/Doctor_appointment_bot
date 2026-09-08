import Patient from './patient.model.js'

class PatientRepository {
  async findByPhone(phone) {
    return Patient.findOne({ phone })
  }

  async findOrCreate(phone, data = {}) {
    const name = data.name ? String(data.name).trim() : ''

    if (name && name.toLowerCase() !== 'unknown') {
      const nameRegex = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')

      // 1. Try to find existing patient with same phone and name (case-insensitive)
      let patient = await Patient.findOne({ phone, name: nameRegex })
      if (patient) return patient

      // 2. Check if an 'Unknown' placeholder exists for this phone to upgrade it
      const unknownPatient = await Patient.findOne({ phone, name: 'Unknown' })
      if (unknownPatient) {
        return Patient.findByIdAndUpdate(unknownPatient._id, { ...data, name }, { new: true })
      }

      // 3. Different name provided for this phone number -> Create a distinct patient record
      return Patient.create({ phone, ...data, name })
    }

    // 4. Default fallback when name is 'Unknown' or not provided
    let patient = await Patient.findOne({ phone })
    if (!patient) {
      patient = await Patient.create({ phone, name: 'Unknown', ...data })
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
