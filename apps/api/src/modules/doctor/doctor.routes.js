import { Router } from 'express'
import { doctorController } from './doctor.controller.js'

const router = Router()

router.get('/',          doctorController.getAll)
router.get('/:id',       doctorController.getById)
router.post('/',         doctorController.create)
router.put('/:id',       doctorController.update)
router.delete('/:id',    doctorController.delete)
router.patch('/:id/toggle', doctorController.toggleActive)

export default router
