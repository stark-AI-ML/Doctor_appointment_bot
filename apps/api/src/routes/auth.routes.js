import { Router } from 'express'
import bcrypt from 'bcryptjs'
import Admin from '../modules/admin/admin.model.js'
import {
  generateTokens,
  storeRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  authMiddleware,
} from '../middleware/auth.middleware.js'

const router = Router()

/** POST /api/auth/login */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    const admin = await Admin.findOne({ email: email.toLowerCase(), isActive: true })
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const payload = { id: admin._id, email: admin.email, role: admin.role }
    const { accessToken, refreshToken } = generateTokens(payload)
    await storeRefreshToken(admin._id.toString(), refreshToken)

    res.json({
      success: true,
      user: admin.toJSON(),
      token: accessToken,
      refreshToken,
    })
  } catch (err) { next(err) }
})

/** POST /api/auth/refresh — get new access token using refresh token */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' })
    }

    const decoded = await verifyRefreshToken(refreshToken)
    const payload = { id: decoded.id, email: decoded.email, role: decoded.role }
    const tokens = generateTokens(payload)
    await storeRefreshToken(decoded.id, tokens.refreshToken)

    res.json({
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' })
  }
})

/** POST /api/auth/logout */
router.post('/logout', authMiddleware, async (req, res) => {
  await revokeRefreshToken(req.admin.id)
  res.json({ success: true })
})

/** GET /api/auth/me */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id)
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' })
    res.json(admin.toJSON())
  } catch (err) { next(err) }
})

export default router
