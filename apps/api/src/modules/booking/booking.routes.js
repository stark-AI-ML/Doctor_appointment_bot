import { Router } from 'express'
import { bookingController } from './booking.controller.js'

const router = Router()

// Bookings
router.get('/',                bookingController.getAll)
router.get('/:id',             bookingController.getById)
router.patch('/:id/status',    bookingController.updateStatus)
router.delete('/:id',          bookingController.delete)

export default router
