import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock all external modules BEFORE importing the service ──────────
vi.mock('../src/modules/conversation/conversation.repository.js', () => ({
  default: { findByPhone: vi.fn(), upsert: vi.fn(), resetState: vi.fn(), deleteByPhone: vi.fn() }
}))
vi.mock('../src/modules/doctor/doctor.service.js', () => ({
  default: {
    getActiveDoctors: vi.fn(),
    getDoctorById: vi.fn(),
    getDoctorsByDepartment: vi.fn(),
    getAllDoctors: vi.fn(),
  }
}))
vi.mock('../src/modules/department/department.service.js', () => ({
  default: { getActiveDepartments: vi.fn() }
}))
vi.mock('../src/modules/booking/booking.service.js', () => ({
  default: { createBooking: vi.fn() }
}))
vi.mock('../src/modules/patient/patient.service.js', () => ({
  default: { findOrCreateByPhone: vi.fn(), updatePatient: vi.fn() }
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
import bookingService from '../src/modules/booking/booking.service.js'
import patientService from '../src/modules/patient/patient.service.js'
import medicineOrderService from '../src/modules/medicine/medicineOrder.service.js'

// ── Fixtures ────────────────────────────────────────────────────────
const DEPT        = { _id: 'dept1', name: 'Cardiology' }
const DOCTOR      = { _id: 'doc1', name: 'Dr. Smith', qualifications: 'MBBS MD' }
const PATIENT_NEW = { _id: 'pat1', name: 'Unknown' }
const PATIENT_RET = { _id: 'pat1', name: 'Raj Kumar', age: 30, gender: 'Male', district: 'Delhi' }
const BOOKING     = { _id: 'b1', bookingId: 'BK-20260903-001', tokenNumber: 'TKN-123' }
const PHONE       = '919999999999'

// ── Helper: in-memory conversation state store ──────────────────────
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
      phone: p, currentStep: 'WELCOME',
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
  bookingService.createBooking.mockResolvedValue(BOOKING)
  medicineOrderService.createOrder.mockResolvedValue({})
}

/** Send a text message and return the last text sent back to the user */
async function send(msg) {
  await conversationService.handleMessage(PHONE, { type: 'text', body: msg })
  const calls = mockProvider.sendTextMessage.mock.calls
  return calls.length ? calls[calls.length - 1][1] : null
}

// ═══════════════════════════════════════════════════════════════════
describe('Conversation Booking Flow (current)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProvider = { sendTextMessage: vi.fn(), downloadMedia: vi.fn() }
    conversationService.setProvider(mockProvider)
    setupStateStore()
    // Start each test at the welcome step so findByPhone() finds a state
    stateStore[PHONE] = {
      phone: PHONE, currentStep: 'WELCOME',
      selectedDoctorId: null, selectedDate: null,
      tempName: null, tempAge: null, tempGender: null, stateData: {},
    }
    setupDefaultMocks()
  })

  // ── Main Menu ────────────────────────────────────────────────
  it('shows the welcome menu at the start step', async () => {
    stateStore[PHONE] = { phone: PHONE, currentStep: 'WELCOME', ...{} }
    const reply = await send('menu')
    expect(reply).toContain('Namaste')
    expect(reply).toContain('OPD')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  it('shows welcome menu on "00", "menu" and "reset" from any step', async () => {
    stateStore[PHONE] = { phone: PHONE, currentStep: 'PATIENT_NAME' }
    for (const kw of ['00', 'menu', 'reset']) {
      await send(kw)
      expect(stateStore[PHONE].currentStep).toBe('WELCOME')
    }
  })

  it('option 0 at welcome re-shows the menu (no invalid input)', async () => {
    await send('4') // info, stays on WELCOME
    const reply = await send('0')
    expect(reply).toContain('Namaste')
  })

  // ── OPD happy path: new patient ──────────────────────────────
  it('completes the full OPD flow for a new patient', async () => {
    let reply = await send('1')
    expect(reply).toContain('Cardiology')
    expect(stateStore[PHONE].currentStep).toBe('OPD_DEPARTMENT')

    reply = await send('1')
    expect(reply).toContain('Dr. Smith')
    expect(stateStore[PHONE].currentStep).toBe('OPD_DOCTOR')
    expect(stateStore[PHONE].stateData.departmentId).toBe('dept1')

    reply = await send('1')
    expect(reply).toContain('Select Appointment Date')
    expect(stateStore[PHONE].currentStep).toBe('SELECT_DATE')
    expect(stateStore[PHONE].selectedDoctorId).toBe('doc1')

    // pick option 2 from the 7-day list
    reply = await send('2')
    expect(reply).toContain('Patient Name')
    expect(stateStore[PHONE].currentStep).toBe('PATIENT_NAME')

    reply = await send('John Doe')
    expect(reply).toContain('Mobile Number')
    expect(stateStore[PHONE].tempName).toBe('John Doe')

    reply = await send('98765-43210')
    expect(reply).toContain('Age')
    expect(stateStore[PHONE].stateData.mobile).toBe('9876543210') // digits cleaned

    reply = await send('30')
    expect(reply).toContain('Gender')
    expect(stateStore[PHONE].tempAge).toBe(30)

    reply = await send('1')
    expect(reply).toContain('District')
    expect(stateStore[PHONE].tempGender).toBe('Male')

    reply = await send('Delhi')
    expect(reply).toContain('Address')
    expect(stateStore[PHONE].stateData.district).toBe('Delhi')

    reply = await send('Sector 12, Rohini, 110085')
    expect(reply).toContain('Health Problem')
    expect(stateStore[PHONE].stateData.address).toBe('Sector 12, Rohini, 110085')

    reply = await send('Chest pain for 2 days')
    expect(reply).toContain('REVIEW')
    expect(reply).toContain('Dr. Smith')
    expect(stateStore[PHONE].currentStep).toBe('REVIEW')

    reply = await send('1')
    expect(reply).toContain('Appointment Request Received')
    expect(reply).toContain('TKN-123')
    expect(bookingService.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        doctorId: 'doc1',
        departmentId: 'dept1',
        patientId: 'pat1',
        type: 'OPD',
        source: 'whatsapp',
      })
    )
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  // ── OPD: returning patient skips details, chooses WHO_FOR ───
  it('returning patient selects self and jumps to problem step', async () => {
    patientService.findOrCreateByPhone.mockResolvedValue(PATIENT_RET)
    await send('1'); await send('1'); await send('1') // dept -> doc -> date
    const reply = await send('1') // pick date -> existing patient -> WHO_FOR
    expect(reply).toContain('BOOKING FOR WHOM')
    expect(reply).toContain('Raj Kumar')
    expect(stateStore[PHONE].currentStep).toBe('WHO_FOR')

    const reply2 = await send('1') // for self
    expect(reply2).toContain('Health Problem')
    expect(stateStore[PHONE].currentStep).toBe('PATIENT_PROBLEM')
  })

  it('returning patient chooses someone else and enters full details', async () => {
    patientService.findOrCreateByPhone.mockResolvedValue(PATIENT_RET)
    await send('1'); await send('1'); await send('1'); await send('1')
    const reply = await send('2')
    expect(reply).toContain('Patient Name')
    expect(stateStore[PHONE].currentStep).toBe('PATIENT_NAME')
  })

  // ── Typed date input ─────────────────────────────────────────
  it('accepts a typed DD/MM/YYYY date at select-date', async () => {
    await send('1'); await send('1'); await send('1') // dept -> doc -> SELECT_DATE
    const reply = await send('15/09/2026')
    expect(reply).toContain('Patient Name') // valid future date advances
    expect(stateStore[PHONE].currentStep).toBe('PATIENT_NAME')
  })

  it('rejects an invalid typed date and re-shows options', async () => {
    await send('1'); await send('1'); await send('1')
    const reply = await send('not-a-date')
    expect(reply).toContain('Select Appointment Date')
    expect(stateStore[PHONE].currentStep).toBe('SELECT_DATE')
  })

  // ── Back navigation ──────────────────────────────────────────
  it('back from REVIEW goes to problem step', async () => {
    await send('1'); await send('1'); await send('1'); await send('1')
    await send('Test Name'); await send('9876543210'); await send('30'); await send('1')
    await send('Delhi'); await send('Addr 1'); await send('problem')
    const reply = await send('0')
    expect(stateStore[PHONE].currentStep).toBe('PATIENT_PROBLEM')
  })

  it('back from SELECT_DATE returns to doctor list', async () => {
    await send('1'); await send('1'); await send('1')
    const reply = await send('0')
    expect(reply).toContain('Dr. Smith')
    expect(stateStore[PHONE].currentStep).toBe('OPD_DOCTOR')
  })

  it('back from OPD_DEPARTMENT returns to welcome', async () => {
    await send('1')
    const reply = await send('0')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  // ── Invalid inputs at each step ──────────────────────────────
  it('rejects invalid department index', async () => {
    await send('1')
    const reply = await send('99')
    expect(reply).toContain('Invalid input')
    expect(stateStore[PHONE].currentStep).toBe('OPD_DEPARTMENT')
  })

  it('rejects invalid doctor index', async () => {
    await send('1'); await send('1')
    const reply = await send('99')
    expect(reply).toContain('Invalid input')
    expect(stateStore[PHONE].currentStep).toBe('OPD_DOCTOR')
  })

  it('rejects too-short name', async () => {
    await send('1'); await send('1'); await send('1'); await send('1')
    const reply = await send('A')
    expect(reply).toContain('Invalid input')
  })

  it('rejects invalid mobile (< 10 digits)', async () => {
    await send('1'); await send('1'); await send('1'); await send('1')
    await send('Test Name')
    const reply = await send('123')
    expect(reply).toContain('Invalid input')
  })

  it('rejects invalid age', async () => {
    await send('1'); await send('1'); await send('1'); await send('1')
    await send('Test Name'); await send('9876543210')
    const reply = await send('999')
    expect(reply).toContain('Invalid input')
  })

  it('rejects invalid gender option', async () => {
    await send('1'); await send('1'); await send('1'); await send('1')
    await send('Test Name'); await send('9876543210'); await send('25')
    const reply = await send('5')
    expect(reply).toContain('Invalid input')
  })

  it('rejects invalid confirm input at review', async () => {
    await send('1'); await send('1'); await send('1'); await send('1')
    await send('Test'); await send('9876543210'); await send('25'); await send('1')
    await send('Delhi'); await send('Addr'); await send('problem')
    const reply = await send('9')
    expect(reply).toContain('Invalid input')
  })

  // ── Edit at review ───────────────────────────────────────────
  it('edit option at review restarts at patient name', async () => {
    await send('1'); await send('1'); await send('1'); await send('1')
    await send('Test'); await send('9876543210'); await send('25'); await send('1')
    await send('Delhi'); await send('Addr'); await send('problem')
    const reply = await send('2')
    expect(reply).toContain('Patient Name')
    expect(stateStore[PHONE].currentStep).toBe('PATIENT_NAME')
  })

  // ── Greeting only resets at welcome (bugfix) ────────────────
  it('greeting does NOT reset a mid-flow free-text step (bugfix)', async () => {
    stateStore[PHONE] = { phone: PHONE, currentStep: 'HOSP_NAME' }
    await send('hi')
    expect(stateStore[PHONE].currentStep).not.toBe('WELCOME')
  })

  it('greeting still works at the welcome step', async () => {
    stateStore[PHONE] = { phone: PHONE, currentStep: 'WELCOME' }
    await send('hi')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  it('a name starting with letters like "Hi" does not reset', async () => {
    stateStore[PHONE] = { phone: PHONE, currentStep: 'PATIENT_NAME' }
    await send('Himanshu')
    expect(stateStore[PHONE].tempName).toBe('Himanshu')
    expect(stateStore[PHONE].currentStep).toBe('PATIENT_MOBILE')
  })

  // ── Hospitalization flow ─────────────────────────────────────
  it('completes the hospitalization flow', async () => {
    let reply = await send('2')
    expect(reply).toContain('Hospitalization')
    expect(stateStore[PHONE].currentStep).toBe('HOSP_NAME')

    reply = await send('Ramesh')
    expect(reply).toContain('age')
    expect(stateStore[PHONE].currentStep).toBe('HOSP_AGE')

    reply = await send('45')
    expect(reply).toContain('illness')
    expect(stateStore[PHONE].tempAge).toBe(45)

    reply = await send('Fever and weakness')
    expect(reply).toContain('Admission Date')
    expect(stateStore[PHONE].currentStep).toBe('HOSP_DATE')

    reply = await send('1')
    expect(reply).toContain('Hospitalization Request Received')
    expect(bookingService.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'HOSPITALIZATION', source: 'whatsapp' })
    )
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  it('rejects invalid age in hospitalization', async () => {
    await send('2'); await send('Ramesh')
    const reply = await send('abc')
    expect(reply).toContain('Invalid input')
    expect(stateStore[PHONE].currentStep).toBe('HOSP_AGE') // stays, not advanced
  })

  it('back from HOSP_AGE returns to HOSP_NAME', async () => {
    await send('2'); await send('Ramesh')
    await send('0')
    expect(stateStore[PHONE].currentStep).toBe('HOSP_NAME')
  })

  // ── Medicine flow ────────────────────────────────────────────
  it('completes the medicine flow with an image', async () => {
    mockProvider.downloadMedia.mockResolvedValue({ mimeType: 'image/jpeg', buffer: Buffer.from('fake') })
    patientService.findOrCreateByPhone.mockResolvedValue(PATIENT_NEW)

    let reply = await send('3')
    expect(reply).toContain('Online Medicine Order')
    expect(stateStore[PHONE].currentStep).toBe('MED_PRESCRIPTION')

    await conversationService.handleMessage(PHONE, { type: 'image', imageId: 'img1' })
    reply = mockProvider.sendTextMessage.mock.calls.at(-1)[1]
    expect(reply).toContain('delivery address')
    expect(stateStore[PHONE].currentStep).toBe('MED_ADDRESS')
    expect(stateStore[PHONE].stateData.prescriptionUrl).toContain('/uploads/')

    reply = await send('Sector 7, Noida')
    expect(reply).toContain('Prescription Received')
    expect(medicineOrderService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ deliveryAddress: 'Sector 7, Noida' })
    )
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  it('re-asks for the photo when text is sent at medicine step (bugfix)', async () => {
    let reply = await send('3')
    expect(stateStore[PHONE].currentStep).toBe('MED_PRESCRIPTION')
    reply = await send('I want medicine')
    expect(reply).toContain('Online Medicine Order')
    expect(reply).toContain('photo')
    expect(stateStore[PHONE].currentStep).toBe('MED_PRESCRIPTION')
    expect(mockProvider.downloadMedia).not.toHaveBeenCalled()
  })

  // ── Static menu options ──────────────────────────────────────
  it('shows info on option 4', async () => {
    await send('4')
    expect(mockProvider.sendTextMessage.mock.calls.at(-1)[1]).toContain('General Query')
  })

  it('shows support on option 5', async () => {
    await send('5')
    expect(mockProvider.sendTextMessage.mock.calls.at(-1)[1]).toContain('Support')
  })

  it('shows email on option 6', async () => {
    await send('6')
    expect(mockProvider.sendTextMessage.mock.calls.at(-1)[1]).toContain('Email')
  })

  it('handles no messaging provider gracefully', async () => {
    conversationService.setProvider(null)
    await expect(send('1')).resolves.not.toThrow()
  })
})
