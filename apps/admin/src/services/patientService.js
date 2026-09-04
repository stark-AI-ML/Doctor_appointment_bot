import api, { isMockMode } from './api'
import { mockPatients, mockBookings } from '../data/mockData'

const MOCK_DELAY = 300

/**
 * Normalize a patient from backend → UI shape.
 * Backend returns: { id, name, phone, age, gender, totalBookings, lastVisit }
 */
function normalizePatient(p) {
  return {
    id: p.id || p._id,
    name: p.name,
    mobile: p.phone || p.mobile || '',
    age: p.age || null,
    gender: p.gender || null,
    total_bookings: p.totalBookings ?? p.total_bookings ?? 0,
    last_visit: p.lastVisit || p.last_visit || null,
    created_at: p.createdAt || p.created_at,
  }
}

/**
 * Normalize a booking (for patient detail/history view).
 */
function normalizeBookingForHistory(b) {
  return {
    id: b.id || b._id,
    booking_id: b.bookingId || b.booking_id,
    doctor_name: b.doctorId?.name || b.doctor_name || 'Unknown',
    date: b.slotId?.date || b.date || b.createdAt,
    time_slot: b.slotId
      ? `${b.slotId.startTime} - ${b.slotId.endTime}`
      : b.time_slot || '—',
    status: b.status,
  }
}

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
    return data.map(normalizePatient)
  },

  async getPatient(id) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200))
      const patient = mockPatients.find((p) => p.id === Number(id))
      const history = mockBookings.filter((b) => b.mobile === patient?.mobile)
      return { ...patient, bookings: history }
    }
    const { data } = await api.get(`/patients/${id}`)
    const normalized = normalizePatient(data)
    normalized.bookings = (data.bookings || []).map(normalizeBookingForHistory)
    return normalized
  },
}
