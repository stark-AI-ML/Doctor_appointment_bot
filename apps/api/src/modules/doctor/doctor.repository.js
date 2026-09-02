import Doctor from './doctor.model.js'

class DoctorRepository {
  async findAll(filter = {}) {
    return Doctor.find(filter).sort({ name: 1 })
  }

  async findActive() {
    return Doctor.find({ isActive: true }).sort({ name: 1 })
  }

  async findById(id) {
    return Doctor.findById(id)
  }

  async create(data) {
    return Doctor.create(data)
  }

  async update(id, data) {
    return Doctor.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true })
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
