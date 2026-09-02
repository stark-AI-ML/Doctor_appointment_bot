import api, { isMockMode } from './api'
import { mockDoctors } from '../data/mockData'

const MOCK_DELAY = 300

/**
 * Doctor Service — CRUD operations for doctors
 */
export const doctorService = {
  async getDoctors() {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      return [...mockDoctors]
    }
    const { data } = await api.get('/doctors')
    return data
  },

  async getDoctor(id) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200))
      return mockDoctors.find((d) => d.id === Number(id)) || null
    }
    const { data } = await api.get(`/doctors/${id}`)
    return data
  },

  async createDoctor(doctorData) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const newDoctor = {
        id: mockDoctors.length + 1,
        ...doctorData,
        is_active: true,
        avatar: null,
        created_at: new Date().toISOString(),
      }
      mockDoctors.push(newDoctor)
      return newDoctor
    }
    const { data } = await api.post('/doctors', doctorData)
    return data
  },

  async updateDoctor(id, doctorData) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const idx = mockDoctors.findIndex((d) => d.id === Number(id))
      if (idx > -1) {
        mockDoctors[idx] = { ...mockDoctors[idx], ...doctorData }
        return mockDoctors[idx]
      }
      throw new Error('Doctor not found')
    }
    const { data } = await api.put(`/doctors/${id}`, doctorData)
    return data
  },

  async deleteDoctor(id) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const idx = mockDoctors.findIndex((d) => d.id === Number(id))
      if (idx > -1) mockDoctors.splice(idx, 1)
      return { success: true }
    }
    const { data } = await api.delete(`/doctors/${id}`)
    return data
  },

  async toggleActive(id) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const doctor = mockDoctors.find((d) => d.id === Number(id))
      if (doctor) doctor.is_active = !doctor.is_active
      return doctor
    }
    const { data } = await api.patch(`/doctors/${id}/toggle`)
    return data
  },
}
