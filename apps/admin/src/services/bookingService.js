import api, { isMockMode } from './api'
import { mockBookings } from '../data/mockData'

const MOCK_DELAY = 300

/**
 * Booking Service
 * 
 * Full CRUD for bookings with filtering and pagination support.
 * Mock mode simulates filter/search/pagination in-memory.
 */
export const bookingService = {
  /**
   * Get paginated bookings with optional filters
   * @param {Object} params - { page, limit, status, doctor_id, search, date_from, date_to }
   */
  async getBookings(params = {}) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      let filtered = [...mockBookings]
      
      // Apply filters
      if (params.status) {
        filtered = filtered.filter((b) => b.status === params.status)
      }
      if (params.doctor_id) {
        filtered = filtered.filter((b) => b.doctor_id === Number(params.doctor_id))
      }
      if (params.search) {
        const q = params.search.toLowerCase()
        filtered = filtered.filter(
          (b) =>
            b.patient_name.toLowerCase().includes(q) ||
            b.booking_id.toLowerCase().includes(q) ||
            b.mobile.includes(q)
        )
      }

      // Pagination
      const page = params.page || 1
      const limit = params.limit || 10
      const total = filtered.length
      const start = (page - 1) * limit
      const data = filtered.slice(start, start + limit)

      return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
    }
    const { data } = await api.get('/bookings', { params })
    return data
  },

  /**
   * Get single booking by ID
   */
  async getBooking(id) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 200))
      return mockBookings.find((b) => b.id === Number(id)) || null
    }
    const { data } = await api.get(`/bookings/${id}`)
    return data
  },

  /**
   * Update booking status
   * @param {number} id 
   * @param {string} status - 'confirmed', 'cancelled', 'completed'
   */
  async updateStatus(id, status) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const booking = mockBookings.find((b) => b.id === Number(id))
      if (booking) booking.status = status
      return { success: true, booking }
    }
    const { data } = await api.patch(`/bookings/${id}/status`, { status })
    return data
  },

  /**
   * Delete a booking
   */
  async deleteBooking(id) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const idx = mockBookings.findIndex((b) => b.id === Number(id))
      if (idx > -1) mockBookings.splice(idx, 1)
      return { success: true }
    }
    const { data } = await api.delete(`/bookings/${id}`)
    return data
  },
}
