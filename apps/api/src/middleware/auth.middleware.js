import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import redis from '../config/redis.js'

/**
 * JWT auth middleware for admin routes.
 * Checks Authorization: Bearer <accessToken>.
 */
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }

  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, env.jwtSecret)
    req.admin = decoded // { id, email, role }
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

/**
 * Generate access + refresh token pair.
 */
export function generateTokens(payload) {
  const accessToken = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
  const refreshToken = jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn })
  return { accessToken, refreshToken }
}

/**
 * Store refresh token in Redis (for revocation).
 * Key: refresh:<adminId>, Value: token, TTL: 7 days.
 */
export async function storeRefreshToken(adminId, refreshToken) {
  await redis.set(`refresh:${adminId}`, refreshToken, 'EX', 7 * 24 * 60 * 60)
}

/**
 * Verify refresh token — checks JWT validity + Redis existence.
 */
export async function verifyRefreshToken(refreshToken) {
  const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret)
  const stored = await redis.get(`refresh:${decoded.id}`)
  if (stored !== refreshToken) {
    throw new Error('Refresh token revoked')
  }
  return decoded
}

/**
 * Revoke refresh token (on logout).
 */
export async function revokeRefreshToken(adminId) {
  await redis.del(`refresh:${adminId}`)
}
