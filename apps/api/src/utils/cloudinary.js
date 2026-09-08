import { v2 as cloudinary } from 'cloudinary'
import logger from './logger.js'

/**
 * Configure Cloudinary from environment variables.
 */
export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  logger.info(`Cloudinary configured for cloud_name: ${process.env.CLOUDINARY_CLOUD_NAME}`)
} else {
  logger.warn('Cloudinary environment variables missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Local storage fallback active.')
}

/**
 * Upload a prescription image (buffer, base64 string, or local file path) to Cloudinary.
 * @param {string|Buffer} fileInput - Base64 data string, local file path, or file buffer
 * @param {object} options - Optional upload settings (folder, public_id, etc.)
 * @returns {Promise<string>} Secure Cloudinary HTTPS URL or fallback local URL
 */
export async function uploadPrescriptionImage(fileInput, options = {}) {
  const folder = options.folder || process.env.CLOUDINARY_FOLDER || 'docbot_prescriptions'

  if (!isCloudinaryConfigured()) {
    logger.warn('Cloudinary not configured. Returning fallback prescription URL.')
    if (typeof fileInput === 'string' && (fileInput.startsWith('http') || fileInput.startsWith('/uploads'))) {
      return fileInput
    }
    const filename = options.filename || `rx_${Date.now()}_demo.jpg`
    return `/uploads/${filename}`
  }

  try {
    const result = await cloudinary.uploader.upload(fileInput, {
      folder,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      ...options,
    })
    logger.info(`Prescription uploaded to Cloudinary: ${result.secure_url}`)
    return result.secure_url
  } catch (error) {
    logger.error('Cloudinary upload error:', error)
    throw new Error(`Cloudinary upload failed: ${error.message}`)
  }
}

export default cloudinary
