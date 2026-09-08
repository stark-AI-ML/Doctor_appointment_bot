import api, { isMockMode } from './api'
import { mockUsers, mockIdentityState, STAFF_CODE_PREFIX } from '../data/mockData'

const MOCK_DELAY = 300

function nextStaffCode(role) {
  const seq = mockIdentityState.nextStaffSeqByRole[role] || 1
  mockIdentityState.nextStaffSeqByRole[role] = seq + 1
  return `${STAFF_CODE_PREFIX[role]}${String(seq).padStart(3, '0')}`
}

/**
 * Staff Service — /staff page (superadmin/admin manage all staff incl. salary).
 * Mock mode mutates the in-memory mockUsers with role-prefixed staff codes.
 */
export const staffService = {
  async getStaff(role = '', search = '') {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      let list = [...mockUsers]
      if (role) list = list.filter((u) => u.role === role)
      if (search) {
        const q = search.toLowerCase()
        list = list.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.staffCode || '').toLowerCase().includes(q)
        )
      }
      return list
    }
    const { data } = await api.get('/users', { params: { role, search } })
    return data
  },

  async createStaff(payload) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      if (mockUsers.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
        throw new Error('Email already registered')
      }
      const user = {
        id: Math.max(...mockUsers.map((u) => u.id)) + 1,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        staffCode: nextStaffCode(payload.role),
        doctorId: payload.doctorId || null,
        phone: payload.phone || '',
        salary: Number(payload.salary) || 0,
        joiningDate: payload.joiningDate || null,
        address: payload.address || '',
        activeDays: Array.isArray(payload.activeDays) && payload.activeDays.length > 0 ? payload.activeDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        is_active: true,
      }
      mockUsers.push(user)
      return user
    }
    const { data } = await api.post('/users', payload)
    return data
  },

  async updateStaff(id, payload) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const idx = mockUsers.findIndex((u) => u.id === Number(id))
      if (idx === -1) throw new Error('Staff not found')
      mockUsers[idx] = { ...mockUsers[idx], ...payload }
      return mockUsers[idx]
    }
    const { data } = await api.put(`/users/${id}`, payload)
    return data
  },

  async toggleActive(id) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const user = mockUsers.find((u) => u.id === Number(id))
      if (!user) throw new Error('Staff not found')
      user.is_active = !user.is_active
      return user
    }
    const { data } = await api.patch(`/users/${id}/toggle`)
    return data
  },
}
