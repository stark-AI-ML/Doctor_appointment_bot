import Service from './service.model.js'

class ServiceRepository {
  async findAll(filter = {}) {
    return Service.find(filter).sort({ name: 1 })
  }

  async findActive() {
    return Service.find({ isActive: true }).sort({ name: 1 })
  }

  async findById(id) {
    return Service.findById(id)
  }

  async create(data) {
    return Service.create(data)
  }

  async update(id, data) {
    return Service.findByIdAndUpdate(id, data, { new: true })
  }

  async delete(id) {
    return Service.findByIdAndDelete(id)
  }
}

export default new ServiceRepository()
