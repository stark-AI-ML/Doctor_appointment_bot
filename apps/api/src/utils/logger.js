/**
 * Simple logger — wraps console with timestamps.
 * Replace with pino/winston later if needed.
 */
const logger = {
  info: (...args) => console.log(`[${timestamp()}] INFO:`, ...args),
  warn: (...args) => console.warn(`[${timestamp()}] WARN:`, ...args),
  error: (...args) => console.error(`[${timestamp()}] ERROR:`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${timestamp()}] DEBUG:`, ...args)
    }
  },
}

function timestamp() {
  return new Date().toISOString().slice(11, 19)
}

export default logger
