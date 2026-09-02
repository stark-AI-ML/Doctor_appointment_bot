import api, { isMockMode } from './api'
import { mockSettings } from '../data/mockData'

const MOCK_DELAY = 300

/**
 * Settings Service — clinic config, WhatsApp settings, notifications
 */
export const settingsService = {
  async getSettings() {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      return { ...mockSettings }
    }
    const { data } = await api.get('/settings')
    return data
  },

  async updateSettings(settingsData) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      Object.assign(mockSettings, settingsData)
      return { ...mockSettings }
    }
    const { data } = await api.put('/settings', settingsData)
    return data
  },
}
