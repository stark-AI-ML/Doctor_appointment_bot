import api, { isMockMode } from './api'
import { mockTimeSlots } from '../data/mockData'

const MOCK_DELAY = 300

/**
 * Normalize a timeslot from backend → UI shape.
 * Backend: { id, doctorId, date, startTime, endTime, isAvailable }
 * UI:      { id, doctor_id, date, time, is_booked }
 */
function normalizeSlot(s) {
  return {
    id: s.id || s._id,
    doctor_id: s.doctorId?.id || s.doctorId?._id || s.doctorId,
    date: s.date,
    time: `${s.startTime} - ${s.endTime}`,
    startTime: s.startTime,
    endTime: s.endTime,
    is_booked: s.isAvailable === false,
  }
}

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
    if (!doctorId) return []
    const { data } = await api.get('/timeslots', { params: { doctor_id: doctorId } })
    return data.map(normalizeSlot)
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
    // Parse UI time format to backend shape
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const backendPayload = {
      doctorId: slotData.doctor_id,
      date: slotData.date || tomorrow.toISOString(),
      startTime: slotData.startTime || slotData.time,
      endTime: slotData.endTime || calculateEndTime(slotData.startTime || slotData.time),
    }

    const { data } = await api.post('/timeslots', backendPayload)
    return normalizeSlot(data)
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
    return normalizeSlot(data)
  },
}

/**
 * Given a start time like "10:00", return end time "11:00" (1-hour slot).
 */
function calculateEndTime(startTime) {
  if (!startTime) return '11:00'
  const [h, m] = startTime.split(':').map(Number)
  const endH = (h + 1) % 24
  return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
