import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock all external modules BEFORE importing the service ──────────
vi.mock('../src/modules/conversation/conversation.repository.js', () => ({
  default: { findByPhone: vi.fn(), upsert: vi.fn(), resetState: vi.fn(), deleteByPhone: vi.fn() }
}))
vi.mock('../src/modules/doctor/doctor.service.js', () => ({
  default: { getActiveDoctors: vi.fn(), getDoctorById: vi.fn(), getDoctorsByDepartment: vi.fn() }
}))
vi.mock('../src/modules/department/department.service.js', () => ({
  default: { getActiveDepartments: vi.fn() }
}))
vi.mock('../src/modules/booking/booking.service.js', () => ({
  default: { createBooking: vi.fn() }
}))
vi.mock('../src/modules/patient/patient.service.js', () => ({
  default: { findOrCreateByPhone: vi.fn(), registerPatientWithBooking: vi.fn() }
}))
vi.mock('../src/modules/medicine/medicineOrder.service.js', () => ({
  default: { createOrder: vi.fn() }
}))
vi.mock('../src/utils/logger.js', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }
}))

// ── Imports ─────────────────────────────────────────────────────────
import conversationService from '../src/modules/conversation/conversation.service.js'
import conversationRepo from '../src/modules/conversation/conversation.repository.js'
import doctorService from '../src/modules/doctor/doctor.service.js'
import departmentService from '../src/modules/department/department.service.js'
import patientService from '../src/modules/patient/patient.service.js'
import medicineOrderService from '../src/modules/medicine/medicineOrder.service.js'

// ── Fixtures ────────────────────────────────────────────────────────
const DEPT = { _id: 'dept1', name: 'General Consultation' }
const DOCTOR = { _id: 'doc1', name: 'Dr. Smith', qualifications: 'MBBS', departmentId: 'dept1' }
const PATIENT_NEW = { _id: 'pat1', name: 'Unknown' }
const PATIENT_RETURNING = { _id: 'pat1', name: 'Raj Kumar', age: 30, gender: 'Male', district: 'Jaunpur' }
const PHONE = '919999999999'

let stateStore
let mockProvider

function setupStateStore() {
  stateStore = {}
  conversationRepo.findByPhone.mockImplementation(async (p) => stateStore[p] || null)
  conversationRepo.upsert.mockImplementation(async (p, data) => {
    stateStore[p] = { ...(stateStore[p] || {}), phone: p, ...data }
    return stateStore[p]
  })
  conversationRepo.resetState.mockImplementation(async (p) => {
    stateStore[p] = {
      phone: p, currentStep: 'WELCOME', currentFlow: null,
      selectedDoctorId: null, selectedDate: null,
      tempName: null, tempAge: null, tempGender: null, stateData: {},
    }
    return stateStore[p]
  })
}

function setupDefaultMocks() {
  departmentService.getActiveDepartments.mockResolvedValue([DEPT])
  doctorService.getActiveDoctors.mockResolvedValue([DOCTOR])
  doctorService.getDoctorsByDepartment.mockResolvedValue([DOCTOR])
  doctorService.getDoctorById.mockResolvedValue(DOCTOR)
  patientService.findOrCreateByPhone.mockResolvedValue(PATIENT_NEW)
  patientService.registerPatientWithBooking.mockResolvedValue({
    patient: { _id: 'pat1', name: 'John Doe', uhid: 'KGN-2026-00001' },
    booking: { _id: 'b1', bookingId: 'BK-20260907-001', tokenNumber: 'T-001' },
  })
  medicineOrderService.createOrder.mockResolvedValue({ _id: 'm1', orderId: 'MED-202609-001' })
}

/** Send a text message, return the last reply */
async function send(text) {
  await conversationService.handleMessage(PHONE, { type: 'text', body: text })
  const calls = mockProvider.sendTextMessage.mock.calls
  return calls.length ? calls[calls.length - 1][1] : null
}

/** Drive a new patient to the REVIEW step, return the review text */
async function driveToReview() {
  await send('hi')       // WELCOME
  await send('1')        // OPD → departments
  await send('1')        // dept → doctors
  await send('1')        // doctor → dates
  await send('1')        // date → patient name (new patient)
  await send('John Doe') // → mobile
  await send('9876543210') // → age
  await send('30')       // → gender
  await send('1')        // Male → district
  await send('Jaunpur')  // → address
  await send('Civil Lines 222001') // → problem
  return send('Fever for 2 days')   // → REVIEW
}

// ═══════════════════════════════════════════════════════════════════
describe('Conversation Booking Flow (current)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProvider = { sendTextMessage: vi.fn(), downloadMedia: vi.fn() }
    conversationService.setProvider(mockProvider)
    setupStateStore()
    setupDefaultMocks()
  })

  it('welcomes a first-time user', async () => {
    const reply = await send('hi')
    expect(reply).toContain('Namaste')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  it('goes WELCOME → departments → doctors → dates', async () => {
    await send('hi')
    let reply = await send('1')
    expect(reply).toContain('General Consultation')
    expect(stateStore[PHONE].currentStep).toBe('OPD_DEPARTMENT')

    reply = await send('1')
    expect(reply).toContain('Dr. Smith')
    expect(stateStore[PHONE].currentStep).toBe('OPD_DOCTOR')

    reply = await send('1')
    expect(reply).toContain('Dr. Smith')
    expect(stateStore[PHONE].currentStep).toBe('SELECT_DATE')
  })

  it('completes the full OPD flow for a new patient via shared registration', async () => {
    const review = await driveToReview()
    expect(review).toContain('REVIEW')
    expect(stateStore[PHONE].currentStep).toBe('REVIEW')

    const reply = await send('1')
    expect(patientService.registerPatientWithBooking).toHaveBeenCalledWith(
      expect.objectContaining({ phone: PHONE, name: 'John Doe', type: 'OPD' }),
      { source: 'whatsapp' },
      { validate: false }
    )
    expect(reply).toContain('T-001')
    expect(reply).toContain('KGN-2026-00001')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  it('routes a returning patient through WHO_FOR', async () => {
    patientService.findOrCreateByPhone.mockResolvedValue(PATIENT_RETURNING)
    await send('hi'); await send('1'); await send('1'); await send('1')
    const reply = await send('1')
    expect(reply).toContain('BOOKING FOR WHOM')
    expect(stateStore[PHONE].currentStep).toBe('WHO_FOR')

    const next = await send('2') // someone else → full form
    expect(next).toContain('Patient Name')
    expect(stateStore[PHONE].currentStep).toBe('PATIENT_NAME')
  })

  it('steps back with 0', async () => {
    await send('hi'); await send('1')
    const reply = await send('0')
    expect(reply).toContain('Namaste')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  it('resets with menu/00 from mid-flow', async () => {
    await send('hi'); await send('1'); await send('1')
    const reply = await send('menu')
    expect(reply).toContain('Namaste')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  it('rejects invalid department/doctor/date inputs', async () => {
    await send('hi'); await send('1')
    let reply = await send('99')
    expect(reply).toContain('Invalid input')

    await send('1')
    reply = await send('99')
    expect(reply).toContain('Invalid input')

    await send('1')
    reply = await send('not-a-date')
    expect(reply).toContain('Select Appointment Date')
  })

  it('rejects bad mobile/age/gender in patient form', async () => {
    await send('hi'); await send('1'); await send('1'); await send('1'); await send('1')
    await send('John Doe')
    let reply = await send('123')
    expect(reply).toContain('Invalid input')
    await send('9876543210')
    reply = await send('999')
    expect(reply).toContain('Invalid input')
    await send('30')
    reply = await send('9')
    expect(reply).toContain('Invalid input')
  })

  it('completes the hospitalization flow via shared registration', async () => {
    patientService.registerPatientWithBooking.mockResolvedValue({
      patient: { _id: 'pat1', name: 'Ramesh', uhid: 'KGN-2026-00002' },
      booking: { _id: 'b2', bookingId: 'BK-20260907-002', tokenNumber: null },
    })
    await send('hi')
    await send('2')
    expect(stateStore[PHONE].currentStep).toBe('HOSP_NAME')
    await send('Ramesh')
    await send('45')
    await send('Chest pain')
    expect(stateStore[PHONE].currentStep).toBe('HOSP_DATE')
    const reply = await send('1')
    expect(patientService.registerPatientWithBooking).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'HOSPITALIZATION' }),
      { source: 'whatsapp' },
      { validate: false }
    )
    expect(reply).toContain('Hospitalization Request Received')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  it('completes the medicine flow with a prescription image', async () => {
    mockProvider.downloadMedia.mockResolvedValue({ mimeType: 'image/jpeg', buffer: Buffer.from('img') })
    await send('hi')
    await send('3')
    expect(stateStore[PHONE].currentStep).toBe('MED_PRESCRIPTION')
    await conversationService.handleMessage(PHONE, { type: 'image', imageId: 'img1' })
    expect(stateStore[PHONE].currentStep).toBe('MED_ADDRESS')
    const reply = await send('Civil Lines, Jaunpur 222001')
    expect(medicineOrderService.createOrder).toHaveBeenCalled()
    expect(reply).toContain('Prescription Received')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  it('re-asks for the photo when text is sent instead of an image', async () => {
    await send('hi'); await send('3')
    const reply = await send('no photo, just text')
    expect(reply).toContain('prescription')
    expect(stateStore[PHONE].currentStep).toBe('MED_PRESCRIPTION')
  })

  it('shows info/support/email options without leaving WELCOME', async () => {
    await send('hi')
    for (const opt of ['4', '5', '6']) {
      const reply = await send(opt)
      expect(reply).toBeTruthy()
      expect(stateStore[PHONE].currentStep).toBe('WELCOME')
    }
  })
})
