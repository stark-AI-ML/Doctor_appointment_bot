import Doctor from './doctor.model.js'

function prepareDoctorData(data) {
  const payload = { ...data }
  if (!payload.specialization && payload.role) payload.specialization = payload.role
  if (!payload.role && payload.specialization) payload.role = payload.specialization
  if (!payload.qualifications && payload.qualification) payload.qualifications = payload.qualification
  if (!payload.qualification && payload.qualifications) payload.qualification = payload.qualifications
  if (!payload.AOF && payload.specialty) payload.AOF = payload.specialty
  if (!payload.specialty && payload.AOF) payload.specialty = payload.AOF
  const img = payload.image || payload.imageUrl || payload.ImageUrl
  if (img) {
    payload.image = img
    payload.imageUrl = img
    payload.ImageUrl = img
  }
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
