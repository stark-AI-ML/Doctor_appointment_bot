import api, { isMockMode } from './api'
import { mockDashboardStats, mockBookings, mockChartData } from '../data/mockData'

const MOCK_DELAY = 300

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
    return data
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
    return data
  },
}
