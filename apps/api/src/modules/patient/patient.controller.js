import patientService from './patient.service.js'
import bookingRepo from '../booking/booking.repository.js'

export const patientController = {
  async search(req, res, next) {
    try {
      const patients = await patientService.searchPatients(req.query.search)

      // Enrich with booking count + last visit
      const enriched = await Promise.all(
        patients.map(async (p) => {
          const pJson = p.toJSON()
          const bookings = await bookingRepo.findAll({ patientId: p._id }, { page: 1, limit: 1 })
          pJson.totalBookings = bookings.total
          pJson.lastVisit = bookings.data[0]?.createdAt || null
          return pJson
        })
      )

      res.json(enriched)
    } catch (err) { next(err) }
  },

  async getById(req, res, next) {
    try {
      const patient = await patientService.getPatientById(req.params.id)
      if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' })

      // Get their bookings
      const bookings = await bookingRepo.findAll({ patientId: patient._id }, { page: 1, limit: 50 })

      res.json({ ...patient.toJSON(), bookings: bookings.data })
    } catch (err) { next(err) }
  },
}
