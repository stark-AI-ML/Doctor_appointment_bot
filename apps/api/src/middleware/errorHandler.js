import logger from '../utils/logger.js'

/**
 * Global error handler — catches all unhandled errors from routes.
 */
export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  logger.error(`${req.method} ${req.url} → ${status}: ${message}`)

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

/**
 * Custom error class with status code.
 */
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
  }
}
