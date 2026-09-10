import { describe, it, expect } from 'vitest'
import mongoose from 'mongoose'
import { normalizePhone } from '../src/utils/phone.js'
import { toGender, validateRegistration, toObjectIdString } from '../src/utils/registration.js'
import { requireRole } from '../src/middleware/rbac.middleware.js'
import idsService from '../src/modules/ids/ids.service.js'

describe('normalizePhone', () => {
  it('prefixes 10-digit numbers with 91', () => {
    expect(normalizePhone('98765 43210')).toBe('919876543210')
    expect(normalizePhone('9876543210')).toBe('919876543210')
  })
  it('keeps 12-digit 91 numbers as-is', () => {
    expect(normalizePhone('919876543210')).toBe('919876543210')
  })
  it('handles leading zero', () => {
    expect(normalizePhone('09876543210')).toBe('919876543210')
  })
  it('returns empty for nullish input', () => {
    expect(normalizePhone(null)).toBe('')
    expect(normalizePhone(undefined)).toBe('')
  })
})

describe('toGender', () => {
  it('maps bot inputs 1/2/3', () => {
    expect(toGender('1')).toBe('male')
    expect(toGender('2')).toBe('female')
    expect(toGender('3')).toBe('other')
  })
  it('passes through english + hindi labels', () => {
    expect(toGender('Male')).toBe('male')
    expect(toGender('महिला')).toBe('female')
    expect(toGender('xyz')).toBeNull()
  })
})

describe('validateRegistration', () => {
  const validOPD = {
    phone: '9876543210', name: 'Ramesh Kumar', age: 45, gender: 'Male',
    district: 'Jaunpur', address: 'Civil Lines', doctorId: 'doc1',
    preferredDate: new Date(Date.now() + 86400000).toISOString(), type: 'OPD',
  }
  it('accepts a valid OPD registration', () => {
    expect(validateRegistration(validOPD)).toEqual([])
  })
  it('rejects short name, bad mobile, bad age, bad gender', () => {
    expect(validateRegistration({ ...validOPD, name: 'A' }).length).toBeGreaterThan(0)
    expect(validateRegistration({ ...validOPD, phone: '123' }).length).toBeGreaterThan(0)
    expect(validateRegistration({ ...validOPD, age: 999 }).length).toBeGreaterThan(0)
    expect(validateRegistration({ ...validOPD, gender: 'X' }).length).toBeGreaterThan(0)
  })
  it('mandates a doctor for OPD but not for HOSPITALIZATION (R4)', () => {
    const noDoc = { ...validOPD, doctorId: null }
    expect(validateRegistration(noDoc).join(' ')).toContain('Doctor is required')
    expect(validateRegistration({ ...noDoc, type: 'HOSPITALIZATION' })).toEqual([])
  })
  it('rejects past preferred dates', () => {
    expect(validateRegistration({ ...validOPD, preferredDate: '2020-01-01' }).length).toBeGreaterThan(0)
  })
})

describe('ids.service formats (pure)', () => {
  it('formats UHID/token/booking/staff codes per spec', () => {
    expect(idsService.formats.uhid('092026', 42)).toBe('KGN-092026-00042')
    expect(idsService.formats.token('OPD', '07092026', 1)).toBe('T-OPD-07092026-001')
    expect(idsService.formats.token('IPD', '07092026', 12)).toBe('T-IPD-07092026-012')
    expect(idsService.formats.booking('20260907', 3)).toBe('BK-20260907-003')
    expect(idsService.formats.staffCode('receptionist', 4)).toBe('KGN_RC_004')
    expect(idsService.formats.staffCode('doctor', 1)).toBe('KGN_DOC_001')
    expect(idsService.formats.staffCode('pharmacy', 2)).toBe('KGN_PHR_002')
    expect(idsService.formats.staffCode('superadmin', 1)).toBe('KGN_SA_001')
  })
})

describe('requireRole', () => {
  const run = (role, ...allowed) => new Promise((resolve) => {
    const req = { admin: role ? { role } : undefined }
    const next = (err) => resolve(err)
    requireRole(...allowed)(req, {}, next)
  })
  it('allows listed roles', async () => {
    expect(await run('receptionist', 'admin', 'receptionist')).toBeUndefined()
  })
  it('blocks unlisted + legacy unknown roles with 403', async () => {
    const err1 = await run('doctor', 'admin', 'receptionist')
    expect(err1?.statusCode).toBe(403)
    const err2 = await run('staff', 'superadmin', 'admin', 'doctor', 'receptionist', 'pharmacy')
    expect(err2?.statusCode).toBe(403)
    const err3 = await run(null, 'admin')
    expect(err3?.statusCode).toBe(403)
  })
})

describe('toObjectIdString', () => {
  it('accepts valid 24-hex strings (frontend path)', () => {
    expect(toObjectIdString('6a97371ad87abb2ebcdb4f0c')).toBe('6a97371ad87abb2ebcdb4f0c')
  })
  it('accepts ObjectId instances (WhatsApp bot path: getId(doc) is an ObjectId object)', () => {
    const oid = new mongoose.Types.ObjectId('6a97371ad87abb2ebcdb4f0c')
    expect(typeof oid).toBe('object')
    expect(toObjectIdString(oid)).toBe('6a97371ad87abb2ebcdb4f0c')
  })
  it('rejects garbage to null (names, numbers, short ids, nullish)', () => {
    expect(toObjectIdString('General Consultation')).toBeNull()
    expect(toObjectIdString(1)).toBeNull()
    expect(toObjectIdString('abc123')).toBeNull()
    expect(toObjectIdString(null)).toBeNull()
    expect(toObjectIdString(undefined)).toBeNull()
    expect(toObjectIdString('')).toBeNull()
  })
})
