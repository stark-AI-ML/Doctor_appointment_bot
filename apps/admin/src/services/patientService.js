import api, { isMockMode } from './api'
import { mockPatients, mockBookings } from '../data/mockData'

const MOCK_DELAY = 300

/**
 * Patient Service — read-only operations (patients come from bookings)
 */
export const patientService = {
  async getPatients(search = '') {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      if (search) {
        const q = search.toLowerCase()
        return mockPatients.filter(
          (p) => p.name.toLowerCase().includes(q) || p.mobile.includes(q)
        )
      }
      return [...mockPatients]
    }
    const { data } = await api.get('/patients', { params: { search } })
    return data
  },

  async getPatient(id) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200))
      const patient = mockPatients.find((p) => p.id === Number(id))
      const history = mockBookings.filter((b) => b.mobile === patient?.mobile)
      return { ...patient, bookings: history }
    }
    const { data } = await api.get(`/patients/${id}`)
    return data
  },
}
