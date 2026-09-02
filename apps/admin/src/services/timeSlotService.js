import api, { isMockMode } from './api'
import { mockTimeSlots } from '../data/mockData'

const MOCK_DELAY = 300

/**
 * Time Slot Service — manage available time slots per doctor
 */
export const timeSlotService = {
  async getSlots(doctorId) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      if (doctorId) {
        return mockTimeSlots.filter((s) => s.doctor_id === Number(doctorId))
      }
      return [...mockTimeSlots]
    }
    const { data } = await api.get('/timeslots', { params: { doctor_id: doctorId } })
    return data
  },

  async createSlot(slotData) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const newSlot = {
        id: mockTimeSlots.length + 1,
        ...slotData,
        is_booked: false,
      }
      mockTimeSlots.push(newSlot)
      return newSlot
    }
    const { data } = await api.post('/timeslots', slotData)
    return data
  },

  async deleteSlot(id) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const idx = mockTimeSlots.findIndex((s) => s.id === Number(id))
      if (idx > -1) mockTimeSlots.splice(idx, 1)
      return { success: true }
    }
    const { data } = await api.delete(`/timeslots/${id}`)
    return data
  },

  async toggleBooked(id) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const slot = mockTimeSlots.find((s) => s.id === Number(id))
      if (slot) slot.is_booked = !slot.is_booked
      return slot
    }
    const { data } = await api.patch(`/timeslots/${id}/toggle`)
    return data
  },
}
