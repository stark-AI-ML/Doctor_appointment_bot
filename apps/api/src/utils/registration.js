/**
 * Registration validation + gender normalization — dependency-free so both
 * the API service and unit tests can use it without DB/Redis.
 * Rules mirror the WhatsApp bot prompts step-for-step.
 */
const GENDERS = ['male', 'female', 'other']

export function toGender(input) {
  if (input === null || input === undefined) return null
  const map = { 1: 'male', 2: 'female', 3: 'other' }
  const lower = String(input).trim().toLowerCase()
  if (map[lower]) return map[lower]
  if (GENDERS.includes(lower)) return lower
  if (lower === 'पुरुष') return 'male'
  if (lower === 'महिला') return 'female'
  if (lower === 'अन्य') return 'other'
  return null
}

function digitsOnly(raw) {
  return String(raw || '').replace(/\D/g, '')
}

/**
 * Coerce a possible Mongo id to its 24-hex string form, or null.
 * Accepts valid strings AND ObjectId instances (Mongoose documents hand
 * back ObjectId objects — e.g. the WhatsApp bot's selectedDoctorId —
 * while the frontend sends plain strings). Anything else → null.
 */
export function toObjectIdString(id) {
  if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) return id
  if (id && typeof id === 'object' && /^[0-9a-fA-F]{24}$/.test(String(id))) return String(id)
  return null
}

import { parseAnyDate } from './dateHelpers.js'

/**
 * Validate registration fields. Returns an array of error strings (empty = valid).
 * OPD mandates a doctor (R4); HOSPITALIZATION does not.
 */
export function validateRegistration(data = {}) {
  const errors = []
  if (!data.name || String(data.name).trim().length < 2) errors.push('Name must be at least 2 characters')
  if (digitsOnly(data.phone).length !== 10) errors.push('Valid 10-digit mobile number is required')
  const age = parseInt(data.age, 10)
  if (data.age === undefined || data.age === null || String(data.age).trim() === '' || isNaN(age) || age < 1 || age > 120) {
    errors.push('Age must be between 1 and 120')
  }
  if (!toGender(data.gender)) errors.push('Gender must be Male, Female or Other')
  if ((data.type || 'OPD') === 'OPD' && !data.doctorId) errors.push('Doctor is required for OPD booking')
  if (data.preferredDate) {
    const d = parseAnyDate(data.preferredDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (!d || d < today) errors.push('Preferred date must be today or a future date')
  }
  return errors
}
