import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import doctorRoutes from '../modules/doctor/doctor.routes.js'
import bookingRoutes from '../modules/booking/booking.routes.js'
import { bookingController } from '../modules/booking/booking.controller.js'
import { serviceController } from '../modules/service/service.controller.js'
import { patientController } from '../modules/patient/patient.controller.js'
import authRoutes from './auth.routes.js'

const router = Router()

// ─── Public routes ───────────────────────────────────────
router.use('/auth', authRoutes)

// ─── Protected routes (all require JWT) ──────────────────
router.use('/doctors',   authMiddleware, doctorRoutes)
router.use('/bookings',  authMiddleware, bookingRoutes)

// Services
router.get('/services',       authMiddleware, serviceController.getAll)
router.get('/services/:id',   authMiddleware, serviceController.getById)
router.post('/services',      authMiddleware, serviceController.create)
router.put('/services/:id',   authMiddleware, serviceController.update)
router.delete('/services/:id', authMiddleware, serviceController.delete)

// Time Slots
router.get('/timeslots',          authMiddleware, bookingController.getSlots)
router.post('/timeslots',         authMiddleware, bookingController.createSlot)
router.delete('/timeslots/:id',   authMiddleware, bookingController.deleteSlot)
router.patch('/timeslots/:id/toggle', authMiddleware, bookingController.toggleSlot)

// Patients
router.get('/patients',     authMiddleware, patientController.search)
router.get('/patients/:id', authMiddleware, patientController.getById)

// Dashboard
router.get('/dashboard/stats',  authMiddleware, bookingController.getStats)
router.get('/dashboard/recent', authMiddleware, bookingController.getRecent)
router.get('/dashboard/chart',  authMiddleware, bookingController.getChart)

export default router
