import api, { isMockMode } from './api'
import { bookingService } from './bookingService'
import { patientService } from './patientService'
import { mockPatients, mockDoctors } from '../data/mockData'

const digitsOnly = (v) => String(v || '').replace(/\D/g, '')

/** Channel labels for the SOURCE box — matches bookingSource enum. */
export const SOURCE_LABELS = {
  whatsapp: 'WhatsApp Bot',
  admin: 'Admin Panel',
  offline: 'Front Desk',
  website: 'Website',
}

export function sourceLabel(booking = {}) {
  const src = booking.booking_source || booking.bookingSource
  if (src && SOURCE_LABELS[src]) return SOURCE_LABELS[src]
  return null
}

function mergeSlipFields(row, patient, doctorSpec) {
  // Channel defaults to whatsapp unless the row says otherwise; a staff
  // code without a channel means the offline front desk.
  const source = row.booking_source || row.bookingSource || (row.created_by ? 'offline' : 'whatsapp')
  return {
    ...row,
    booking_source: source,
    age: row.age ?? patient?.age ?? null,
    gender: row.gender || patient?.gender || '',
    address: row.address || patient?.address || '',
    district: row.district || patient?.district || '',
    pinCode: row.pinCode || patient?.pinCode || patient?.pin_code || '',
    uhid: row.uhid || patient?.uhid || 'KGN-PENDING',
    isOld: row.isOld ?? row.is_old ?? patient?.isOld ?? patient?.is_old ?? null,
    doctor_specialization: row.doctor_specialization || doctorSpec || '',
    source_label: SOURCE_LABELS[source] || '—',
  }
}

/**
 * Print data service — builds the complete object PatientPrintSlip needs.
 * List rows only carry names; age/gender/address/UHID/doctor-specialization
 * come from the booking detail + patient record (real mode) or the mock
 * patients/doctors tables (mock mode).
 */
export const printService = {
  async getSlipData(booking) {
    if (!booking) throw new Error('No booking provided')

    if (isMockMode()) {
      const key = digitsOnly(booking.mobile).slice(-10)
      const patient = mockPatients.find((p) => digitsOnly(p.mobile).slice(-10) === key) || null
      const doctor = mockDoctors.find((d) => d.id === Number(booking.doctor_id)) || null
      return mergeSlipFields(booking, patient, doctor?.specialization)
    }

    // Real mode: booking detail (populated doctor + patient age/gender) …
    const detail = await bookingService.getBooking(booking.id)
    // … plus the patient record (address/district/UHID/isOld).
    let patient = null
    if (detail.patient_id) {
      try {
        patient = await patientService.getPatient(detail.patient_id)
      } catch {
        patient = null
      }
    }
    const merged = mergeSlipFields(detail, patient, detail.doctor_specialization)
    // patient detail nests bookings; keep the slip flat
    delete merged.bookings
    return merged
  },
}
