import { Router } from 'express'
import medicineController from './medicineOrder.controller.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

const router = Router()

router.get('/', asyncHandler(medicineController.getOrders.bind(medicineController)))
router.post('/upload', asyncHandler(medicineController.uploadPrescription.bind(medicineController)))
router.patch('/:id/status', asyncHandler(medicineController.updateStatus.bind(medicineController)))

export default router
