import { Router } from 'express'
import { userController } from './user.controller.js'

const router = Router()

router.get('/', userController.getAll)
router.post('/', userController.create)
router.put('/:id', userController.update)
router.patch('/:id/toggle', userController.toggleActive)

export default router
