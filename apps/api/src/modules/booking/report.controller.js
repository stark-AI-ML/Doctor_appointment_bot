import bookingRepo from './booking.repository.js'
import doctorRepo from '../doctor/doctor.repository.js'
import Booking from './booking.model.js'
import Doctor from '../doctor/doctor.model.js'

export const reportController = {
  /**
   * GET /api/reports/bookings?from=&to=
   * Returns daily booking counts (same shape as dashboard chart).
   */
  async getBookingTrends(req, res, next) {
    try {
      const days = 30
      const start = new Date()
      start.setDate(start.getDate() - days)
      start.setHours(0, 0, 0, 0)

      const data = await Booking.aggregate([
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
        { $project: { _id: 0, date: '$_id', bookings: 1, confirmed: 1, cancelled: 1 } },
      ])

      res.json(data)
    } catch (err) { next(err) }
  },

  /**
   * GET /api/reports/doctors
   * Returns per-doctor booking stats.
   */
  async getDoctorStats(req, res, next) {
    try {
      const data = await Booking.aggregate([
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctorId',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        { $unwind: '$doctor' },
        {
          $lookup: {
            from: 'services',
            localField: 'serviceId',
            foreignField: '_id',
            as: 'service',
          },
        },
        { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$doctorId',
            doctor: { $first: '$doctor.name' },
            bookings: { $sum: 1 },
            revenue: { $sum: { $ifNull: ['$doctor.consultationFee', 0] } },
            completed: {
              $sum: { $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            doctor: 1,
            bookings: 1,
            revenue: 1,
            completion_rate: {
              $cond: [
                { $gt: ['$bookings', 0] },
                { $round: [{ $multiply: [{ $divide: ['$completed', '$bookings'] }, 100] }, 0] },
                0,
              ],
            },
          },
        },
        { $sort: { bookings: -1 } },
      ])

      res.json(data)
    } catch (err) { next(err) }
  },

  /**
   * GET /api/reports/status-distribution
   * Returns booking counts grouped by status.
   */
  async getStatusDistribution(req, res, next) {
    try {
      const data = await Booking.aggregate([
        {
          $group: {
            _id: '$status',
            value: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            name: { $concat: [{ $toUpper: { $substrCP: ['$_id', 0, 1] } }, { $substrCP: ['$_id', 1, 99] }] },
            value: 1,
          },
        },
        { $sort: { name: 1 } },
      ])

      res.json(data)
    } catch (err) { next(err) }
  },

  /**
   * GET /api/reports/revenue?from=&to=
   * Returns total/average revenue and growth.
   */
  async getRevenue(req, res, next) {
    try {
      // Revenue = sum of consultationFee for all non-cancelled bookings
      const result = await Booking.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctorId',
            foreignField: '_id',
            as: 'doctor',
          },
        },
        { $unwind: '$doctor' },
        {
          $group: {
            _id: null,
            total: { $sum: '$doctor.consultationFee' },
            count: { $sum: 1 },
            oldestBooking: { $min: '$createdAt' },
          },
        },
      ])

      const stats = result[0] || { total: 0, count: 0 }
      const daySpan = stats.oldestBooking
        ? Math.max(1, Math.ceil((Date.now() - new Date(stats.oldestBooking)) / 86400000))
        : 1

      res.json({
        total: stats.total,
        average_per_day: Math.round(stats.total / daySpan),
        growth: 0, // placeholder — needs historical comparison
      })
    } catch (err) { next(err) }
  },
}
