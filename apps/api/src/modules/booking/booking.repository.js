import Booking from './booking.model.js'

class BookingRepository {
  async findAll(filter = {}, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      Booking.find(filter)
        .populate('doctorId', 'name department role consultationFee')
        .populate('patientId', 'name phone uhid age gender')
        .populate('serviceId', 'name price duration')
        .populate('slotId', 'date startTime endTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findById(id) {
    return Booking.findById(id)
      .populate('doctorId', 'name department role consultationFee')
      .populate('patientId', 'name phone uhid age gender')
      .populate('serviceId', 'name price duration')
      .populate('slotId', 'date startTime endTime')
  }

  /**
   * Distinct patient ids for a doctor — powers "My Patients".
   * The doctor↔patient relation is derived from bookings (no junction table).
   */
  async findDistinctPatientIdsByDoctor(doctorId) {
    return Booking.distinct('patientId', { doctorId, status: { $ne: 'cancelled' } })
  }

  async findByPatientPhone(phone) {    // Find patient by phone, then their bookings
    const Patient = (await import('../patient/patient.model.js')).default
    const patient = await Patient.findOne({ phone })
    if (!patient) return []
    return Booking.find({ patientId: patient._id, status: { $ne: 'cancelled' } })
      .populate('doctorId', 'name')
      .populate('slotId', 'date startTime endTime')
      .sort({ createdAt: -1 })
  }

  async create(data) {
    const booking = await Booking.create(data)
    return this.findById(booking._id)
  }

  async updateStatus(id, status) {
    return Booking.findByIdAndUpdate(id, { status, updatedAt: new Date() }, { new: true })
  }

  async delete(id) {
    return Booking.findByIdAndDelete(id)
  }

  /**
   * Count bookings with bookingId matching a prefix (for ID generation).
   * e.g., prefix = "BK-20260901-"
   */
  async countByDatePrefix(prefix) {
    return Booking.countDocuments({ bookingId: { $regex: `^${prefix}` } })
  }

  /** Dashboard stats */
  async getStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [total, todayCount, confirmed, cancelled] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
    ])
    return { total, todayCount, confirmed, cancelled }
  }

  /** Recent bookings for dashboard */
  async getRecent(limit = 5) {
    return Booking.find()
      .populate('doctorId', 'name department role')
      .populate('patientId', 'name phone uhid')
      .populate('serviceId', 'name')
      .populate('slotId', 'date startTime endTime')
      .sort({ createdAt: -1 })
      .limit(limit)
  }

  /** Chart data: bookings per day for a date range */
  async getChartData(daysBack = 7) {
    const start = new Date()
    start.setDate(start.getDate() - daysBack)
    start.setHours(0, 0, 0, 0)

    return Booking.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ])
  }
}

export default new BookingRepository()
