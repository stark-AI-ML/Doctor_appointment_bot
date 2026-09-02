import mongoose from 'mongoose'
import env from './env.js'
import logger from '../utils/logger.js'

export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri)
    logger.info(`MongoDB connected: ${mongoose.connection.host}`)
  } catch (err) {
    logger.error('MongoDB connection failed:', err.message)
    process.exit(1)
  }
}

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err.message)
})
