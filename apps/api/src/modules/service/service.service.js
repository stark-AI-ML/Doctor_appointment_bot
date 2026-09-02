import serviceRepo from './service.repository.js'
import { cache } from '../../config/redis.js'

const CACHE_KEY = 'services:all'
const CACHE_TTL = 300

class ServiceService {
  async getAllServices() {
    return cache.wrap(CACHE_KEY, () => serviceRepo.findAll(), CACHE_TTL)
  }

  async getActiveServices() {
    return cache.wrap('services:active', () => serviceRepo.findActive(), CACHE_TTL)
  }

  async getServiceById(id) {
    return serviceRepo.findById(id)
  }

  async createService(data) {
    const service = await serviceRepo.create(data)
    await cache.invalidate('services:*')
    return service
  }

  async updateService(id, data) {
    const service = await serviceRepo.update(id, data)
    await cache.invalidate('services:*')
    return service
  }

  async deleteService(id) {
    await serviceRepo.delete(id)
    await cache.invalidate('services:*')
    return { success: true }
  }
}

export default new ServiceService()
