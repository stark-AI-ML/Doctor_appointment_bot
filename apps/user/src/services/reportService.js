import api, { isMockMode } from './api'
import { mockChartData, mockDoctorReport, mockStatusDistribution } from '../data/mockData'

const MOCK_DELAY = 400

/**
 * Normalize chart data point (backend uses `_id` or `date` as key)
 */
function normalizeChartItem(item) {
  return {
    date: item.date || item._id,
    bookings: item.bookings || 0,
    confirmed: item.confirmed || 0,
    cancelled: item.cancelled || 0,
  }
}

/**
 * Report Service — analytics and reporting data
 */
export const reportService = {
  async getBookingTrends(from, to) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      return mockChartData
    }
    const { data } = await api.get('/reports/bookings', { params: { from, to } })
    return data.map(normalizeChartItem)
  },

  async getDoctorStats() {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      return mockDoctorReport
    }
    const { data } = await api.get('/reports/doctors')
    return data
  },

  async getStatusDistribution() {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      return mockStatusDistribution
    }
    const { data } = await api.get('/reports/status-distribution')
    return data
  },

  async getRevenue(from, to) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      return { total: 86400, average_per_day: 12343, growth: 12.5 }
    }
    const { data } = await api.get('/reports/revenue', { params: { from, to } })
    return data
  },
}
