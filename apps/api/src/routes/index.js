import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireRole, ROLES } from '../middleware/rbac.middleware.js'
import doctorRoutes from '../modules/doctor/doctor.routes.js'
import bookingRoutes from '../modules/booking/booking.routes.js'
import { bookingController } from '../modules/booking/booking.controller.js'
import { reportController } from '../modules/booking/report.controller.js'
import { serviceController } from '../modules/service/service.controller.js'
import { patientController } from '../modules/patient/patient.controller.js'
import { settingsController } from '../modules/settings/settings.controller.js'
import authRoutes from './auth.routes.js'
import medicineOrderRoutes from '../modules/medicine/medicineOrder.routes.js'
import userRoutes from '../modules/user/user.routes.js'

const { SUPERADMIN, ADMIN, DOCTOR, RECEPTIONIST, PHARMACY } = ROLES
const STAFF = [SUPERADMIN, ADMIN, RECEPTIONIST, PHARMACY]

const router = Router()

// ─── Public routes ───────────────────────────────────────
router.use('/auth', authRoutes)

// ─── All routes below require JWT ────────────────────────
router.use(authMiddleware)

// Doctors — read for all staff, write for admin/superadmin
router.use('/doctors', requireRole(SUPERADMIN, ADMIN, DOCTOR, RECEPTIONIST), doctorRoutes)

// Bookings (OPD + hospitalization) — doctor sees own only (scoped in controller)
router.use('/bookings', requireRole(SUPERADMIN, ADMIN, DOCTOR, RECEPTIONIST), bookingRoutes)

// Medicine orders — pharmacy full, receptionist read-only (enforced in controller), doctor own-linked
router.use('/medicine-orders', requireRole(SUPERADMIN, ADMIN, PHARMACY, RECEPTIONIST, DOCTOR), medicineOrderRoutes)

// Staff management — superadmin + admin
router.use('/users', requireRole(SUPERADMIN, ADMIN), userRoutes)

// Services catalogue
router.get('/services',       requireRole(...STAFF, DOCTOR), serviceController.getAll)
router.get('/services/:id',   requireRole(...STAFF, DOCTOR), serviceController.getById)
router.post('/services',      requireRole(SUPERADMIN, ADMIN), serviceController.create)
router.put('/services/:id',   requireRole(SUPERADMIN, ADMIN), serviceController.update)
router.delete('/services/:id', requireRole(SUPERADMIN, ADMIN), serviceController.delete)

// Time Slots
router.get('/timeslots',          requireRole(...STAFF, DOCTOR), bookingController.getSlots)
router.post('/timeslots',         requireRole(SUPERADMIN, ADMIN), bookingController.createSlot)
router.delete('/timeslots/:id',   requireRole(SUPERADMIN, ADMIN), bookingController.deleteSlot)
router.patch('/timeslots/:id/toggle', requireRole(SUPERADMIN, ADMIN), bookingController.toggleSlot)

// Patients — doctor sees own only (scoped in controller)
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
