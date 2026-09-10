import patientRepo from './patient.repository.js'
import bookingService from '../booking/booking.service.js'
import idsService from '../ids/ids.service.js'
import { normalizePhone } from '../../utils/phone.js'
import { toGender, validateRegistration, toObjectIdString } from '../../utils/registration.js'
import { AppError } from '../../middleware/errorHandler.js'
import logger from '../../utils/logger.js'

class PatientService {
  async findByPhone(phone) {
    return patientRepo.findByPhone(phone)
  }

  async findAllByPhone(phone) {
    return patientRepo.findAllByPhone(phone)
  }

  async findOrCreateByPhone(phone, data = {}) {
    const patient = await patientRepo.findOrCreate(phone, data)
    if (!patient.uhid && patient.name && patient.name !== 'Unknown') {
      patient.uhid = await idsService.ensureUhidForPhone(phone, patient.name)
      await patient.save()
    }
    return patient
  }

  async getPatientById(id) {
    return patientRepo.findById(id)
  }

  async searchPatients(query, filters = {}) {
    return patientRepo.search(query, filters)
  }

  async updatePatient(id, data) {
    return patientRepo.update(id, data)
  }

  /**
   * Patients assigned to a doctor = distinct patients from that
   * doctor's bookings. No junction table — bookings are the relation.
   */
  async getDoctorPatients(doctorId) {
    const { default: bookingRepo } = await import('../booking/booking.repository.js')
    const patientIds = await bookingRepo.findDistinctPatientIdsByDoctor(doctorId)
    if (!patientIds.length) return []
    const Patient = (await import('./patient.model.js')).default
    return Patient.find({ _id: { $in: patientIds } }).sort({ name: 1 })
  }

  /**
   * Shared registration core — mirrors the WhatsApp `handleReview` flow.
   * Used by BOTH the bot and POST /patients/register so both channels
   * produce identical records (same UHID-per-phone, same token series).
   *
   * opts.validate=false is for the bot only: its fields were already
   * validated step-by-step at entry (and returning patients may carry
   * legacy nulls). The endpoint always validates at the boundary.
   */
  async registerPatientWithBooking(data, meta = {}, opts = {}) {
    const { source = 'whatsapp', createdBy = null, createdByRole = null } = meta
    const { validate = true } = opts
    if (validate) {
      const errors = validateRegistration(data)
      if (errors.length) throw new AppError(errors.join('; '), 400)
    }

    const phone = normalizePhone(data.phone)
    const preferredDate = data.preferredDate ? new Date(data.preferredDate) : new Date()

    const isOld = data.isOld !== undefined && data.isOld !== null
      ? (data.isOld === true || data.isOld === 'true')
      : false

    const patient = await patientRepo.findOrCreate(phone, {
      name: String(data.name).trim(),
      age: parseInt(data.age, 10),
      gender: toGender(data.gender),
      district: data.district || '',
      address: data.address || '',
      pinCode: data.pinCode || '',
      isOld,
      lastVisited: preferredDate,
    })

    if (patient.isOld !== isOld || !patient.lastVisited) {
      patient.isOld = isOld
      patient.lastVisited = preferredDate
      await patient.save()
    }

    // One UHID per phone + patient name combination.
    if (!patient.uhid) {
      patient.uhid = await idsService.ensureUhidForPhone(phone, patient.name)
      await patient.save()
    }

    const type = data.type === 'HOSPITALIZATION' ? 'HOSPITALIZATION' : 'OPD'

    // Accept both valid id strings (frontend) and ObjectId instances
    // (WhatsApp bot stores getId(doc) which is an ObjectId object).
    // Anything else (names, numbers, garbage) → null.
    let doctorId = toObjectIdString(data.doctorId)
    let departmentId = toObjectIdString(data.departmentId)

    if (doctorId && !departmentId) {
      try {
        const { default: doctorRepo } = await import('../doctor/doctor.repository.js')
        const doc = await doctorRepo.findById(doctorId)
        if (doc && doc.departmentId) {
          const docDeptId = doc.departmentId._id || doc.departmentId
          const coerced = toObjectIdString(docDeptId)
          if (coerced) {
            departmentId = coerced
          }
        }
      } catch (err) {
        // ignore lookup error
      }
    }

    // Token follows the user's selection: T-OPD-DDMMYYYY-001 or T-IPD-DDMMYYYY-001,
    // sequential per doctor per day (walk-in hospitalization shares the daily 'general' series).
    const tokenNumber = await idsService.generateToken(type, doctorId, preferredDate)

    const booking = await bookingService.createBooking({
      doctorId,
      departmentId,
      patientId: patient._id,
      preferredDate,
      problemDescription: data.problemDescription || '',
      type,
      source,
      tokenNumber,
      createdBy,
      createdByRole,
    })

    logger.info(`Registered ${type} booking ${booking.bookingId} for phone ${phone} (source: ${source})`)
    return { patient, booking }
  }
}

export default new PatientService()
