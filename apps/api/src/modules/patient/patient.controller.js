import patientService from './patient.service.js'
import bookingRepo from '../booking/booking.repository.js'
import MedicineOrder from '../medicine/medicineOrder.model.js'

export const patientController = {
  async search(req, res, next) {
    try {
      // Doctors see only their assigned patients (derived from their bookings).
      if (req.admin?.role === 'doctor') {
        if (!req.admin.doctorId) {
          return res.status(403).json({ success: false, message: 'No doctor profile linked to this login' })
        }
        const patients = await patientService.getDoctorPatients(req.admin.doctorId)
        const q = (req.query.search || '').toLowerCase()
        const filtered = q
          ? patients.filter((p) => p.name.toLowerCase().includes(q) || (p.phone || '').includes(q))
          : patients
        return res.json(filtered.map((p) => p.toJSON()))
      }
      const patients = await patientService.searchPatients(req.query.search)
      // Pharmacy sees only patients linked to medicine orders.
      let scoped = patients
      if (req.admin?.role === 'pharmacy') {
        const linkedIds = await MedicineOrder.distinct('patientId')
        const linked = new Set(linkedIds.map(String))
        scoped = patients.filter((p) => linked.has(String(p._id)))
      }
      // Enrich with booking count + last visit
      const enriched = await Promise.all(
        scoped.map(async (p) => {
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

  /**
   * POST /api/patients/register — receptionist offline registration.
   * Mirrors the WhatsApp handleReview flow via the shared core, so both
   * channels produce identical records (same UHID, same token series).
   */
  async register(req, res, next) {
    try {
      const { patient, booking } = await patientService.registerPatientWithBooking(
        req.body,
        {
          source: 'admin',
          createdBy: req.admin?.id || null,
          createdByRole: req.admin?.role || null,
        }
      )
      res.status(201).json({ success: true, patient, booking })
    } catch (err) { next(err) }
  },

  /**
   * GET /api/patients/mine — doctor's assigned patients (scoped from JWT).
   */
  async getMine(req, res, next) {
    try {
      if (!req.admin?.doctorId) {
        return res.status(403).json({ success: false, message: 'No doctor profile linked to this login' })
      }
      const patients = await patientService.getDoctorPatients(req.admin.doctorId)
      res.json(patients)
    } catch (err) { next(err) }
  },
}
