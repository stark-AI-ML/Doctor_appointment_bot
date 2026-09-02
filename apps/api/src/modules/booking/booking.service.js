import bookingRepo from './booking.repository.js'
import slotRepo from './timeslot.repository.js'
import patientRepo from '../patient/patient.repository.js'
import doctorRepo from '../doctor/doctor.repository.js'
import { cache } from '../../config/redis.js'
import logger from '../../utils/logger.js'
import { AppError } from '../../middleware/errorHandler.js'
import { formatDateDisplay } from '../../utils/dateHelpers.js'

class BookingService {
  /**
   * Get paginated bookings with optional filters.
   */
  async getBookings({ page = 1, limit = 10, status, doctor_id, search } = {}) {
    const filter = {}
    if (status) filter.status = status
    if (doctor_id) filter.doctorId = doctor_id

    // search requires a patient lookup first
    if (search) {
      const regex = new RegExp(search, 'i')
      const patients = await patientRepo.search(search)
      const patientIds = patients.map((p) => p._id)

      filter.$or = [
        { bookingId: regex },
        { patientId: { $in: patientIds } },
      ]
    }

    return bookingRepo.findAll(filter, { page, limit })
  }

  async getBookingById(id) {
    return bookingRepo.findById(id)
  }

  /**
   * Create a booking — marks slot as unavailable.
   */
  async createBooking({ doctorId, patientId, serviceId, slotId, source = 'whatsapp' }) {
    // Verify slot is available
    const slot = await slotRepo.findById(slotId)
    if (!slot || !slot.isAvailable) {
      throw new AppError('Time slot is no longer available', 400)
    }

    // Generate booking ID: BK-YYYYMMDD-NNN
    const bookingId = await this.generateBookingId()

    // Create booking
    const booking = await bookingRepo.create({
      bookingId,
      doctorId,
      patientId,
      serviceId,
      slotId,
      status: 'pending',
      bookingSource: source,
    })

    // Mark slot as unavailable
    await slotRepo.setAvailability(slotId, false)

    // Invalidate dashboard cache
    await cache.invalidate('dashboard:*')

    logger.info(`Booking created: ${bookingId}`)
    return booking
  }

  /**
   * Update booking status. If cancelled, free the slot.
   */
  async updateBookingStatus(id, status) {
    const booking = await bookingRepo.findById(id)
    if (!booking) throw new AppError('Booking not found', 404)

    // If cancelling, free the slot
    if (status === 'cancelled' && booking.slotId) {
      await slotRepo.setAvailability(booking.slotId._id || booking.slotId, true)
    }

    const updated = await bookingRepo.updateStatus(id, status)
    await cache.invalidate('dashboard:*')
    return updated
  }

  async deleteBooking(id) {
    const booking = await bookingRepo.findById(id)
    if (booking?.slotId) {
      await slotRepo.setAvailability(booking.slotId._id || booking.slotId, true)
    }
    await bookingRepo.delete(id)
    await cache.invalidate('dashboard:*')
    return { success: true }
  }

  /**
   * Get available slots for a doctor on a date.
   * Auto-generates default slots (10am-5pm, lunch 1-2pm) if none exist.
   */
  async getAvailableSlots(doctorId, date) {
    const exists = await slotRepo.existsForDate(doctorId, date)
    if (!exists) {
      await this.generateDefaultSlots(doctorId, date)
    }
    return slotRepo.findAvailable(doctorId, date)
  }

  /**
   * Auto-generate default time slots for a doctor on a date.
   * Schedule: 10am-1pm, 2pm-5pm (1hr slots, lunch break 1-2pm)
   */
  async generateDefaultSlots(doctorId, date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)

    const slots = [
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '12:00', endTime: '13:00' },
      // 13:00-14:00 = lunch break
      { startTime: '14:00', endTime: '15:00' },
      { startTime: '15:00', endTime: '16:00' },
      { startTime: '16:00', endTime: '17:00' },
    ]

    const docs = slots.map((s) => ({
      doctorId,
      date: d,
      startTime: s.startTime,
      endTime: s.endTime,
      isAvailable: true,
    }))

    await slotRepo.createMany(docs)
    logger.info(`Generated ${docs.length} default slots for doctor ${doctorId} on ${formatDateDisplay(d)}`)
  }

  /**
   * Generate booking ID: BK-YYYYMMDD-NNN
   */
  async generateBookingId() {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const prefix = `BK-${dateStr}-`
    const count = await bookingRepo.countByDatePrefix(prefix)
    const seq = String(count + 1).padStart(3, '0')
    return `${prefix}${seq}`
  }

  /** Dashboard stats — cached 2 min */
  async getStats() {
    return cache.wrap('dashboard:stats', async () => {
      const bookingStats = await bookingRepo.getStats()
      const totalDoctors = await doctorRepo.countAll()
      const activeDoctors = await doctorRepo.countActive()
      const totalPatients = await patientRepo.countAll()

      return {
        totalBookings: bookingStats.total,
        todayBookings: bookingStats.todayCount,
        confirmed: bookingStats.confirmed,
        cancelled: bookingStats.cancelled,
        totalDoctors,
        activeDoctors,
        totalPatients,
      }
    }, 120)
  }

  /** Recent bookings for dashboard */
  async getRecentBookings(limit = 5) {
    return bookingRepo.getRecent(limit)
  }

  /** Chart data for dashboard */
  async getChartData(range = '7d') {
    const days = range === '30d' ? 30 : range === '90d' ? 90 : 7
    const cacheKey = `dashboard:chart:${days}`
    return cache.wrap(cacheKey, () => bookingRepo.getChartData(days), 120)
  }

  /** Get bookings for a patient by phone (for WhatsApp "My Bookings") */
  async getBookingsByPhone(phone) {
    return bookingRepo.findByPatientPhone(phone)
  }
}

export default new BookingService()
