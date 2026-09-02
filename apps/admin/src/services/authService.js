import api, { isMockMode } from './api'
import { mockUser } from '../data/mockData'

/**
 * Auth Service
 * 
 * Handles login/logout/session. In mock mode, accepts any credentials
 * and returns a fake token. When backend is ready, hits real endpoints.
 */

const MOCK_DELAY = 400

export const authService = {
  /**
   * Login with email and password
   * @returns {{ user, token }}
   */
  async login(email, password) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      if (email === 'admin@docbot.com' && password === 'admin123') {
        const token = 'mock_jwt_token_' + Date.now()
        return { user: mockUser, token }
      }
      throw new Error('Invalid email or password')
    }
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  /**
   * Get current logged-in user
   */
  async getMe() {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, 100))
      return mockUser
    }
    const { data } = await api.get('/auth/me')
    return data
  },

  /**
   * Logout
   */
  async logout() {
    if (isMockMode()) {
      return true
    }
    await api.post('/auth/logout')
    return true
  },
}
