import { v2 as cloudinary } from 'cloudinary'
import logger from './logger.js'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

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
 * Upload an image (Buffer, base64 DataURL, or local filepath) to Cloudinary.
 * @param {string|Buffer} fileInput - Base64 data string, local filepath, or file buffer
 * @param {object} options - Upload options (folder, prefix, filename, etc.)
 * @returns {Promise<string>} Secure Cloudinary HTTPS URL or fallback local URL
 */
export async function uploadImageToCloudinary(fileInput, options = {}) {
  if (!fileInput) return ''

  // If already a hosted HTTPS URL or relative upload URL, return as-is
  if (typeof fileInput === 'string' && (fileInput.startsWith('http://') || fileInput.startsWith('https://') || fileInput.startsWith('/uploads/'))) {
    return fileInput
  }

  const folder = options.folder || process.env.CLOUDINARY_FOLDER || 'docbot_general'
  const prefix = options.prefix || 'img'

  // Convert Buffer to data URI string if needed
  let uploadSource = fileInput
  if (Buffer.isBuffer(fileInput)) {
    const mimeType = options.mimeType || 'image/jpeg'
    uploadSource = `data:${mimeType};base64,${fileInput.toString('base64')}`
  }

  if (!isCloudinaryConfigured()) {
    logger.warn(`Cloudinary not configured. Fallback processing for ${prefix}.`)
    try {
      const ext = options.ext || 'jpg'
      const filename = options.filename || `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

      const filepath = path.join(uploadDir, filename)
      if (Buffer.isBuffer(fileInput)) {
        fs.writeFileSync(filepath, fileInput)
      } else if (typeof uploadSource === 'string' && uploadSource.startsWith('data:')) {
        const base64Data = uploadSource.replace(/^data:image\/\w+;base64,/, '')
        fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'))
      } else if (typeof fileInput === 'string' && fs.existsSync(fileInput)) {
        fs.copyFileSync(fileInput, filepath)
      } else {
        return `/uploads/${filename}`
      }
      return `/uploads/${filename}`
    } catch (err) {
      logger.error('Local fallback upload error:', err)
      return typeof fileInput === 'string' && fileInput.length < 500 ? fileInput : ''
    }
  }

  try {
    const result = await cloudinary.uploader.upload(uploadSource, {
      folder,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      ...options,
    })
    logger.info(`Image uploaded to Cloudinary [${folder}]: ${result.secure_url}`)
    return result.secure_url
  } catch (error) {
    logger.error('Cloudinary upload error:', error)
    throw new Error(`Cloudinary upload failed: ${error.message}`)
  }
}

/**
 * Upload a doctor profile photo to Cloudinary (folder: docbot_doctors)
 */
export async function uploadDoctorImage(fileInput, options = {}) {
  return uploadImageToCloudinary(fileInput, {
    folder: 'docbot_doctors',
    prefix: 'doc',
    ...options,
  })
}

/**
 * Upload a prescription image to Cloudinary (folder: docbot_prescriptions)
 */
export async function uploadPrescriptionImage(fileInput, options = {}) {
  return uploadImageToCloudinary(fileInput, {
    folder: process.env.CLOUDINARY_FOLDER || 'docbot_prescriptions',
    prefix: 'rx',
    ...options,
  })
}

export default cloudinary
