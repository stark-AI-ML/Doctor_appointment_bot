import Patient from './patient.model.js'

class PatientRepository {
  async findByPhone(phone) {
    return Patient.findOne({ phone })
  }

  async findAllByPhone(phone) {
    return Patient.find({ phone, name: { $ne: 'Unknown' } }).sort({ createdAt: 1 })
  }

  async findOrCreate(phone, data = {}) {
    const name = data.name ? String(data.name).trim() : ''

    if (name && name.toLowerCase() !== 'unknown') {
      const nameRegex = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')

      // 1. Try to find existing patient with same phone and name (case-insensitive)
      let patient = await Patient.findOne({ phone, name: nameRegex })
      if (patient) {
        let updated = false
        if (data.isOld !== undefined && patient.isOld !== data.isOld) {
          patient.isOld = Boolean(data.isOld)
          updated = true
        }
        if (data.lastVisited) {
          patient.lastVisited = data.lastVisited
          updated = true
        }
        if (updated) await patient.save()
        return patient
      }

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

  async search(query, filters = {}) {
    const { isOld, sortBy = 'createdAt', sortOrder = 'desc' } = filters
    const filterQuery = {}

    if (isOld !== undefined && isOld !== null && isOld !== '') {
      filterQuery.isOld = isOld === 'true' || isOld === true
    }

    if (query) {
      const regex = new RegExp(query, 'i')
      filterQuery.$or = [{ name: regex }, { phone: regex }]
    }

    const sortObj = {}
    if (sortBy === 'name') sortObj.name = sortOrder === 'asc' ? 1 : -1
    else if (sortBy === 'lastVisited' || sortBy === 'lastVisit') sortObj.lastVisited = sortOrder === 'asc' ? 1 : -1
    else if (sortBy === 'isOld') sortObj.isOld = sortOrder === 'asc' ? 1 : -1
    else sortObj.createdAt = sortOrder === 'asc' ? 1 : -1

    return Patient.find(filterQuery).sort(sortObj).limit(100)
  }

  async update(id, data) {
    return Patient.findByIdAndUpdate(id, data, { new: true })
  }

  async countAll() {
    return Patient.countDocuments()
  }
}

export default new PatientRepository()
