import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireRole, ROLES } from '../middleware/rbac.middleware.js'
import doctorRoutes from '../modules/doctor/doctor.routes.js'
import bookingRoutes from '../modules/booking/booking.routes.js'
import { doctorController } from '../modules/doctor/doctor.controller.js'
import { bookingController } from '../modules/booking/booking.controller.js'
import { reportController } from '../modules/booking/report.controller.js'
import { serviceController } from '../modules/service/service.controller.js'
import { patientController } from '../modules/patient/patient.controller.js'
import { settingsController } from '../modules/settings/settings.controller.js'
import authRoutes from './auth.routes.js'
import medicineOrderRoutes from '../modules/medicine/medicineOrder.routes.js'
import userRoutes from '../modules/user/user.routes.js'
import { parseAnyDate } from '../utils/dateHelpers.js'

const { SUPERADMIN, ADMIN, DOCTOR, RECEPTIONIST, PHARMACY } = ROLES
const STAFF = [SUPERADMIN, ADMIN, RECEPTIONIST, PHARMACY]

const router = Router()

// ─── Public routes (Unprotected - Website Visitors) ───────
router.use('/auth', authRoutes)

// Public Doctor Listings for website frontend (Team.jsx & BookAppointment.jsx)
router.get('/doctors', doctorController.getAll)
router.get('/doctors/:id', doctorController.getById)

// Public Appointment Booking Submission for website frontend
router.post('/bookings', async (req, res, next) => {
  try {
    const Doctor = (await import('../modules/doctor/doctor.model.js')).default
    const patientService = (await import('../modules/patient/patient.service.js')).default

    let doctorId = req.body.doctorId
    let doctorName = req.body.doctor || req.body.doctorName

    // Find doctor by name if doctorId not passed directly
    if (!doctorId && doctorName) {
      const docObj = await Doctor.findOne({ name: new RegExp(doctorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      if (docObj) doctorId = docObj._id
    }

    const registrationData = {
      name: req.body.fullName || req.body.patientName || req.body.name || 'Patient',
      phone: req.body.phone || req.body.patientPhone || req.body.mobile || '',
      age: req.body.age ? parseInt(req.body.age, 10) : 30,
      gender: req.body.gender || 'Male',
      district: req.body.district || 'Chandauli',
      address: req.body.address || 'Chandauli',
      department: req.body.department || '',
      doctorId: doctorId || null,
      preferredDate: parseAnyDate(req.body.preferredDate || req.body.appointmentDate) || new Date(),
      problemDescription: req.body.message || req.body.problemDescription || '',
      type: req.body.type || 'OPD',
    }

    const source = req.body.source || req.body.bookingSource || 'website'

    const { patient, booking } = await patientService.registerPatientWithBooking(
      registrationData,
      { source },
      { validate: false }
    )

    res.status(201).json({
      success: true,
      bookingId: booking.bookingId,
      tokenNumber: booking.tokenNumber,
      uhid: patient?.uhid,
      patient,
      booking,
    })
  } catch (err) {
    next(err)
  }
})

// ─── All routes below require JWT (Staff & Dashboard) ──────
router.use(authMiddleware)

// Doctors — staff dashboard management
router.use('/doctors', requireRole(SUPERADMIN, ADMIN, DOCTOR, RECEPTIONIST), doctorRoutes)

// Bookings (OPD + hospitalization) — staff dashboard management
router.use('/bookings', requireRole(SUPERADMIN, ADMIN, DOCTOR, RECEPTIONIST), bookingRoutes)

// Medicine orders — pharmacy full, receptionist read-only
router.use('/medicine-orders', requireRole(SUPERADMIN, ADMIN, PHARMACY, RECEPTIONIST, DOCTOR), medicineOrderRoutes)

// Staff management — superadmin + admin
router.use('/users', requireRole(SUPERADMIN, ADMIN), userRoutes)

// Services catalogue
router.get('/services',       requireRole(...STAFF, DOCTOR), serviceController.getAll)
router.get('/services/:id',   requireRole(...STAFF, DOCTOR), serviceController.getById)
router.post('/services',      requireRole(SUPERADMIN, ADMIN), serviceController.create)
router.put('/services/:id',   requireRole(SUPERADMIN, ADMIN), serviceController.update)
router.delete('/services/:id', requireRole(SUPERADMIN, ADMIN), serviceController.delete)

// Time Slots — disabled (replaced by maxPatientsPerDay on Doctor model)
// router.get('/timeslots',          requireRole(...STAFF, DOCTOR), bookingController.getSlots)
// router.post('/timeslots',         requireRole(SUPERADMIN, ADMIN), bookingController.createSlot)
// router.delete('/timeslots/:id',   requireRole(SUPERADMIN, ADMIN), bookingController.deleteSlot)
// router.patch('/timeslots/:id/toggle', requireRole(SUPERADMIN, ADMIN), bookingController.toggleSlot)

// Patients — doctor sees own only
router.get('/patients/mine',  requireRole(DOCTOR), patientController.getMine)
router.post('/patients/register', requireRole(SUPERADMIN, ADMIN, RECEPTIONIST), patientController.register)
router.get('/patients',       requireRole(SUPERADMIN, ADMIN, DOCTOR, RECEPTIONIST, PHARMACY), patientController.search)
router.get('/patients/:id',   requireRole(SUPERADMIN, ADMIN, DOCTOR, RECEPTIONIST, PHARMACY), patientController.getById)

// Settings — superadmin only
router.get('/settings', requireRole(SUPERADMIN), settingsController.get)
router.put('/settings', requireRole(SUPERADMIN), settingsController.update)

// Dashboard
router.get('/dashboard/stats',  requireRole(SUPERADMIN, ADMIN), bookingController.getStats)
router.get('/dashboard/recent', requireRole(SUPERADMIN, ADMIN), bookingController.getRecent)
router.get('/dashboard/chart',  requireRole(SUPERADMIN, ADMIN), bookingController.getChart)

// Reports
router.get('/reports/bookings',             requireRole(SUPERADMIN, ADMIN), reportController.getBookingTrends)
router.get('/reports/doctors',              requireRole(SUPERADMIN, ADMIN), reportController.getDoctorStats)
router.get('/reports/status-distribution',  requireRole(SUPERADMIN, ADMIN), reportController.getStatusDistribution)
router.get('/reports/revenue',              requireRole(SUPERADMIN, ADMIN), reportController.getRevenue)

export default router
