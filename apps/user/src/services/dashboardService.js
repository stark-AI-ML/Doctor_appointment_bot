import api, { isMockMode } from './api'
import { mockDashboardStats, mockBookings, mockChartData } from '../data/mockData'

const MOCK_DELAY = 300

/**
 * Normalize a recent booking from the backend's populated shape
 * into the flat shape the dashboard table expects.
 */
function normalizeRecentBooking(b) {
  return {
    id: b.id || b._id,
    booking_id: b.bookingId,
    patient_name: (typeof b.patientId === 'object' && b.patientId?.name) ? b.patientId.name : (b.patient_name || b.patientName || '—'),
    mobile: (typeof b.patientId === 'object' && b.patientId?.phone) ? b.patientId.phone : (b.mobile || b.phone || ''),
    doctor_name: (typeof b.doctorId === 'object' && b.doctorId?.name) ? b.doctorId.name : (b.doctor_name || b.doctorName || '—'),
    date: b.preferredDate || b.date || b.slotId?.date || b.createdAt,
    time_slot: b.slotId ? `${b.slotId.startTime} - ${b.slotId.endTime}` : '—',
    status: b.status,
    created_at: b.createdAt,
  }
}

/**
 * Normalize chart data from backend (aggregation uses `_id` as date key)
 */
function normalizeChartItem(item) {
  return {
    date: item.date || item._id,
    bookings: item.bookings || 0,
    confirmed: item.confirmed || 0,
    cancelled: item.cancelled || 0,
  }
}

export const dashboardService = {
  /**
   * Get dashboard overview stats
   */
  async getStats() {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      return mockDashboardStats
    }
    const { data } = await api.get('/dashboard/stats')
    return data
  },

  /**
   * Get recent bookings for dashboard
   */
  async getRecentBookings(limit = 5) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      return mockBookings.slice(0, limit)
    }
    const { data } = await api.get('/dashboard/recent', { params: { limit } })
    return data.map(normalizeRecentBooking)
  },

  /**
   * Get chart data for booking trends
   * @param {string} range - '7d', '30d', '90d'
   */
  async getChartData(range = '7d') {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      return mockChartData
    }
    const { data } = await api.get('/dashboard/chart', { params: { range } })
    return data.map(normalizeChartItem)
  },
}
