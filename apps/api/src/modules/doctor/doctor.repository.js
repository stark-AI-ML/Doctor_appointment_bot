import Doctor from './doctor.model.js'

/**
 * Map incoming data (which may use old alias names) → canonical schema fields.
 * Accepts either alias and stores only the canonical field.
 */
function prepareDoctorData(data) {
  const payload = { ...data }

  // qualification absorbs qualifications
  if (!payload.qualification && payload.qualifications) {
    payload.qualification = payload.qualifications
  }
  delete payload.qualifications

  // specialty absorbs AOF
  if (!payload.specialty && payload.AOF) {
    payload.specialty = payload.AOF
  }
  delete payload.AOF

  // image absorbs ImageUrl / imageUrl
  const img = payload.image || payload.imageUrl || payload.ImageUrl
  if (img) payload.image = img
  delete payload.imageUrl
  delete payload.ImageUrl

  return payload
}

class DoctorRepository {
  async findAll(filter = {}) {
    return Doctor.find(filter).populate('departmentId', 'name').sort({ name: 1 })
  }

  async findActive() {
    return Doctor.find({ isActive: true }).populate('departmentId', 'name').sort({ name: 1 })
  }

  async findByDepartment(departmentId, { activeOnly = true } = {}) {
    const filter = { departmentId }
    if (activeOnly) filter.isActive = true
    return Doctor.find(filter).populate('departmentId', 'name').sort({ name: 1 })
  }

  async findById(id) {
    return Doctor.findById(id).populate('departmentId', 'name')
  }

  async create(data) {
    return Doctor.create(prepareDoctorData(data))
  }

  async update(id, data) {
    return Doctor.findByIdAndUpdate(id, { ...prepareDoctorData(data), updatedAt: new Date() }, { new: true }).populate('departmentId', 'name')
  }

  async delete(id) {
    return Doctor.findByIdAndDelete(id)
  }

  async toggleActive(id) {
    const doc = await Doctor.findById(id)
    if (!doc) return null
    doc.isActive = !doc.isActive
    return doc.save()
  }

  async countActive() {
    return Doctor.countDocuments({ isActive: true })
  }

  async countAll() {
    return Doctor.countDocuments()
  }
}

export default new DoctorRepository()
