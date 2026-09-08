import Counter from './counter.model.js'
import Patient from '../patient/patient.model.js'
import { STAFF_CODE_PREFIX } from '../user/user.model.js'
import { normalizePhone } from '../../utils/phone.js'
import logger from '../../utils/logger.js'

const pad = (n, len) => String(n).padStart(len, '0')

/** Atomic next-value for a named sequence. */
async function nextSequence(key) {
  const doc = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  )
  return doc.seq
}

function yearOf(d = new Date()) {
  return d.getFullYear()
}

function yyyymmdd(d = new Date()) {
  const dt = new Date(d)
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1, 2)}${pad(dt.getDate(), 2)}`
}

class IdsService {
  /** For tests/seeding without DB races — pure format helpers. */
  formats = {
    uhid: (year, seq) => `KGN-${year}-${pad(seq, 5)}`,
    token: (seq) => `T-${pad(seq, 3)}`,
    booking: (yyyymmddStr, seq) => `BK-${yyyymmddStr}-${pad(seq, 3)}`,
    medOrder: (yyyymm, seq) => `MED-${yyyymm}-${pad(seq, 3)}`,
    staffCode: (role, seq) => `${STAFF_CODE_PREFIX[role]}${pad(seq, 3)}`,
  }

  /**
   * One UHID per phone number + patient name combination.
   * Reuses the UHID already held by any patient doc with this phone and name;
   * generates a new yearly-series UHID when the (phone, name) combination has none.
   */
  async ensureUhidForPhone(rawPhone, rawName = '') {
    const phone = normalizePhone(rawPhone)
    const name = String(rawName || '').trim()

    let query = { phone, uhid: { $ne: null } }
    if (name) {
      const regex = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      query.name = regex
    }

    const existing = await Patient.findOne(query).select('uhid')
    if (existing?.uhid) return existing.uhid

    const seq = await nextSequence(`uhid:${yearOf()}`)
    const uhid = this.formats.uhid(yearOf(), seq)
    logger.info(`Generated UHID ${uhid} for ${name || 'patient'} (${phone})`)
    return uhid
  }

  /** Mint the next UHID in the yearly series (used by the backfill script). */
  async generateUhidDirect(date = new Date()) {
    const seq = await nextSequence(`uhid:${yearOf(date)}`)
    return this.formats.uhid(yearOf(date), seq)
  }

  /** Per-doctor-per-day sequential token: T-001, T-002… (OPD only). Resets daily. */
  async generateToken(doctorId, date = new Date()) {
    const docKey = doctorId ? String(doctorId) : 'general'
    const seq = await nextSequence(`token:${docKey}:${yyyymmdd(date)}`)
    return this.formats.token(seq)
  }

  /** Booking series — same BK-YYYYMMDD-NNN format, now race-safe. */
  async generateBookingId(date = new Date()) {
    const stamp = yyyymmdd(date)
    const seq = await nextSequence(`booking:${stamp}`)
    return this.formats.booking(stamp, seq)
  }

  /** Medicine order series — same MED-YYYYMM-NNN format, now race-safe. */
  async generateMedOrderId(date = new Date()) {
    const dt = new Date(date)
    const stamp = `${dt.getFullYear()}${pad(dt.getMonth() + 1, 2)}`
    const seq = await nextSequence(`medorder:${stamp}`)
    return this.formats.medOrder(stamp, seq)
  }

  /** Role-prefixed staff code, e.g. KGN_RC_001. */
  async generateStaffCode(role) {
    if (!STAFF_CODE_PREFIX[role]) throw new Error(`Unknown role for staff code: ${role}`)
    const seq = await nextSequence(`staffcode:${role}`)
    return this.formats.staffCode(role, seq)
  }
}

export default new IdsService()
