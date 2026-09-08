import api, { isMockMode } from './api'
import { mockDoctors } from '../data/mockData'

const MOCK_DELAY = 300

/**
 * Normalize a doctor from backend → UI shape.
 * Backend now uses canonical fields; aliases provided by toJSON for compat.
 */
function normalizeDoctor(d) {
  return {
    id: d.id || d._id,
    name: d.name,
    role: d.role || '',
    department: d.department || d.departmentId?.name || '',
    qualification: d.qualification || d.qualifications || '',
    specialization: d.specialization || d.department || '',
    specialty: d.specialty || d.AOF || '',
    consultation_fee: d.consultationFee ?? d.consultation_fee ?? 0,
    experience: d.experience ?? '0',
    image: d.image || d.ImageUrl || d.imageUrl || '',
    gender: d.gender || null,
    address: d.address || '',
    is_active: d.isActive ?? d.is_active ?? true,
    maxPatientsPerDay: d.maxPatientsPerDay ?? 30,
    created_at: d.createdAt || d.created_at,
  }
}

/**
 * Convert UI form data → backend shape (canonical fields only)
 */
function toBackendDoctor(formData) {
  return {
    name: formData.name,
    role: formData.role || formData.specialization,
    department: formData.department,
    qualification: formData.qualification || formData.qualifications,
    specialization: formData.specialization || formData.department,
    specialty: formData.specialty || formData.AOF,
    consultationFee: Number(formData.consultation_fee || formData.consultationFee || 0),
    experience: formData.experience,
    image: formData.image || formData.ImageUrl || formData.imageUrl,
    gender: formData.gender || undefined,
    address: formData.address || '',
    maxPatientsPerDay: Number(formData.maxPatientsPerDay || 30),
  }
}

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
    return data.map(normalizeDoctor)
  },

  async getDoctor(id) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200))
      return mockDoctors.find((d) => d.id === Number(id)) || null
    }
    const { data } = await api.get(`/doctors/${id}`)
    return normalizeDoctor(data)
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
    const { data } = await api.post('/doctors', toBackendDoctor(doctorData))
    return normalizeDoctor(data)
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
    const { data } = await api.put(`/doctors/${id}`, toBackendDoctor(doctorData))
    return normalizeDoctor(data)
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
    return normalizeDoctor(data)
  },
}
