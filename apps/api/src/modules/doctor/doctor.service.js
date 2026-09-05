import doctorRepo from './doctor.repository.js'
import { cache } from '../../config/redis.js'

const CACHE_KEY = 'doctors:all'
const CACHE_ACTIVE = 'doctors:active'
const CACHE_TTL = 300 // 5 min

class DoctorService {
  async getAllDoctors() {
    return cache.wrap(CACHE_KEY, () => doctorRepo.findAll(), CACHE_TTL)
  }

  async getActiveDoctors() {
    return cache.wrap(CACHE_ACTIVE, () => doctorRepo.findActive(), CACHE_TTL)
  }

  async getDoctorsByDepartment(departmentId, { activeOnly = true } = {}) {
    return doctorRepo.findByDepartment(departmentId, { activeOnly })
  }

  async getDoctorById(id) {
    return doctorRepo.findById(id)
  }

  async createDoctor(data) {
    const doctor = await doctorRepo.create(data)
    await cache.invalidate('doctors:*')
    return doctor
  }

  async updateDoctor(id, data) {
    const doctor = await doctorRepo.update(id, data)
    await cache.invalidate('doctors:*')
    return doctor
  }

  async deleteDoctor(id) {
    await doctorRepo.delete(id)
    await cache.invalidate('doctors:*')
    return { success: true }
  }

  async toggleActive(id) {
    const doctor = await doctorRepo.toggleActive(id)
    await cache.invalidate('doctors:*')
    return doctor
  }
}

export default new DoctorService()
