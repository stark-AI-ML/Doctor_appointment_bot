import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock all external modules BEFORE importing the service ──────────
vi.mock('../src/modules/conversation/conversation.repository.js', () => ({
  default: { findByPhone: vi.fn(), upsert: vi.fn(), resetState: vi.fn(), deleteByPhone: vi.fn() }
}))
vi.mock('../src/modules/doctor/doctor.service.js', () => ({
  default: { getActiveDoctors: vi.fn(), getDoctorById: vi.fn() }
}))
vi.mock('../src/modules/booking/booking.service.js', () => ({
  default: { getAvailableSlots: vi.fn(), createBooking: vi.fn(), getBookingsByPhone: vi.fn(), updateBookingStatus: vi.fn() }
}))
vi.mock('../src/modules/patient/patient.service.js', () => ({
  default: { findOrCreateByPhone: vi.fn(), updatePatient: vi.fn() }
}))
vi.mock('../src/utils/logger.js', () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }
}))

// ── Imports ─────────────────────────────────────────────────────────
import conversationService from '../src/modules/conversation/conversation.service.js'
import conversationRepo from '../src/modules/conversation/conversation.repository.js'
import doctorService from '../src/modules/doctor/doctor.service.js'
import bookingService from '../src/modules/booking/booking.service.js'
import patientService from '../src/modules/patient/patient.service.js'

// ── Fixtures ────────────────────────────────────────────────────────
// These mirror what actually comes out of Redis cache after JSON.stringify
// triggers the Mongoose toJSON transform (_id → id, __v deleted).
// This is the REAL shape of data in production — NOT raw Mongoose docs.
const DOCTOR_CACHED = { id: 'doc1', name: 'Dr. Smith', specialization: 'Cardiologist' }
const SLOT_CACHED   = { id: 'slot1', startTime: '10:00', endTime: '10:30' }
const PATIENT_NEW   = { _id: 'pat1', name: 'Unknown' }  // from Mongoose directly (no cache)
const PATIENT_RETURNING = { _id: 'pat1', name: 'Raj Kumar', age: 30, gender: 'male' }
const BOOKING       = { _id: 'b1', bookingId: 'BK-20260903-001' }

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
      selectedDoctorId: null, selectedServiceId: null,
      selectedSlotId: null, selectedDate: null,
      tempName: null, tempAge: null, tempGender: null,
    }
    return stateStore[p]
  })
}

function setupDefaultMocks() {
  doctorService.getActiveDoctors.mockResolvedValue([DOCTOR_CACHED])
  doctorService.getDoctorById.mockResolvedValue(DOCTOR_CACHED)
  bookingService.getAvailableSlots.mockResolvedValue([SLOT_CACHED])
  bookingService.createBooking.mockResolvedValue(BOOKING)
  bookingService.getBookingsByPhone.mockResolvedValue([])
  patientService.findOrCreateByPhone.mockResolvedValue(PATIENT_NEW)
  patientService.updatePatient.mockResolvedValue({})
  vi.spyOn(conversationService, 'getSlot').mockResolvedValue(SLOT_CACHED)
}

/** Send a message and return the last text sent back to the user */
async function send(msg) {
  await conversationService.handleMessage(PHONE, msg)
  const calls = mockProvider.sendTextMessage.mock.calls
  return calls.length ? calls[calls.length - 1][1] : null
}

const PHONE = '919999999999'

// ═══════════════════════════════════════════════════════════════════
describe('Conversation Booking Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProvider = { sendTextMessage: vi.fn() }
    conversationService.setProvider(mockProvider)
    setupStateStore()
    setupDefaultMocks()
  })

  // ── Full happy-path: new patient → booking (with cached data) ───
  it('completes the full booking flow for a new patient', async () => {
    let reply = await send('Hi')
    expect(reply).toContain('Namaste')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')

    reply = await send('1')
    expect(reply).toContain('Doctor select karein')
    expect(stateStore[PHONE].currentStep).toBe('SELECT_DOCTOR')

    reply = await send('1')
    expect(reply).toContain('Date select karein')
    expect(stateStore[PHONE].currentStep).toBe('SELECT_DATE')
    expect(stateStore[PHONE].selectedDoctorId).toBe('doc1')

    reply = await send('1')
    expect(reply).toContain('Available Slots')
    expect(stateStore[PHONE].currentStep).toBe('SELECT_SLOT')

    reply = await send('1')
    expect(reply).toContain('apna naam bhejiye')
    expect(stateStore[PHONE].currentStep).toBe('ENTER_NAME')
    expect(stateStore[PHONE].selectedSlotId).toBe('slot1')

    reply = await send('John Doe')
    expect(reply).toContain('apni age bhejiye')
    expect(stateStore[PHONE].tempName).toBe('John Doe')

    reply = await send('30')
    expect(reply).toContain('Gender select karein')
    expect(stateStore[PHONE].tempAge).toBe(30)

    reply = await send('1')
    expect(reply).toContain('Confirm karein')
    expect(reply).toContain('Dr. Smith')

    reply = await send('1')
    expect(reply).toContain('Appointment Confirmed')
    expect(reply).toContain('BK-20260903-001')
    expect(bookingService.createBooking).toHaveBeenCalledWith({
      doctorId: 'doc1', patientId: 'pat1',
      serviceId: null, slotId: 'slot1', source: 'whatsapp',
    })
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  // ── Returning patient skips name/age/gender ─────────────────────
  it('skips patient details for a returning patient', async () => {
    patientService.findOrCreateByPhone.mockResolvedValue(PATIENT_RETURNING)
    await send('Hi')
    await send('1')
    await send('1')
    await send('1')
    const reply = await send('1')
    expect(reply).toContain('Confirm karein')
    expect(stateStore[PHONE].currentStep).toBe('CONFIRM')
  })

  // ── Greeting variants ──────────────────────────────────────────
  it.each(['hi', 'Hi', 'Hii', 'hiii', 'hello', 'Hello', 'hey', 'Hey', 'reset', 'menu', 'start', 'hola'])(
    'resets on greeting: "%s"', async (greeting) => {
      stateStore[PHONE] = { phone: PHONE, currentStep: 'SELECT_DATE', selectedDoctorId: null }
      await send(greeting)
      expect(stateStore[PHONE].currentStep).toBe('WELCOME')
    }
  )

  // ── Stale state guards ─────────────────────────────────────────
  it('resets when SELECT_DATE has null selectedDoctorId', async () => {
    stateStore[PHONE] = { phone: PHONE, currentStep: 'SELECT_DATE', selectedDoctorId: null }
    const reply = await send('1')
    expect(reply).toContain('Namaste')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  it('resets when SELECT_SLOT has null doctor or date', async () => {
    stateStore[PHONE] = { phone: PHONE, currentStep: 'SELECT_SLOT', selectedDoctorId: null, selectedDate: null }
    const reply = await send('1')
    expect(reply).toContain('Namaste')
    expect(stateStore[PHONE].currentStep).toBe('WELCOME')
  })

  // ── Invalid inputs at each step ────────────────────────────────
  it('rejects invalid doctor index', async () => {
    await send('Hi'); await send('1')
    const reply = await send('99')
    expect(reply).toContain('sahi option')
    expect(stateStore[PHONE].currentStep).toBe('SELECT_DOCTOR')
  })

  it('rejects invalid date input', async () => {
    await send('Hi'); await send('1'); await send('1')
    const reply = await send('xyz')
    expect(reply).toContain('sahi option')
    expect(stateStore[PHONE].currentStep).toBe('SELECT_DATE')
  })

  it('rejects invalid slot index', async () => {
    await send('Hi'); await send('1'); await send('1'); await send('1')
    const reply = await send('99')
    expect(reply).toContain('sahi option')
    expect(stateStore[PHONE].currentStep).toBe('SELECT_SLOT')
  })

  it('rejects too-short name', async () => {
    await send('Hi'); await send('1'); await send('1'); await send('1'); await send('1')
    const reply = await send('A')
    expect(reply).toContain('poora naam')
  })

  it('rejects invalid age', async () => {
    await send('Hi'); await send('1'); await send('1'); await send('1'); await send('1')
    await send('Test Name')
    const reply = await send('999')
    expect(reply).toContain('sahi age')
  })

  it('rejects invalid gender option', async () => {
    await send('Hi'); await send('1'); await send('1'); await send('1'); await send('1')
    await send('Test Name'); await send('25')
    const reply = await send('5')
    expect(reply).toContain('sahi option')
  })

  it('rejects invalid confirm input', async () => {
    await send('Hi'); await send('1'); await send('1'); await send('1'); await send('1')
    await send('Test'); await send('25'); await send('1')
    const reply = await send('5')
    expect(reply).toContain('sahi option')
  })

  // ── Change at confirm ──────────────────────────────────────────
  it('restarts doctor selection on "2" at confirm', async () => {
    await send('Hi'); await send('1'); await send('1'); await send('1'); await send('1')
    await send('Test'); await send('25'); await send('1')
    const reply = await send('2')
    expect(reply).toContain('Doctor select karein')
    expect(stateStore[PHONE].currentStep).toBe('SELECT_DOCTOR')
  })

  // ── Edge cases ─────────────────────────────────────────────────
  it('handles no doctors available', async () => {
    doctorService.getActiveDoctors.mockResolvedValue([])
    await send('Hi')
    const reply = await send('1')
    expect(reply).toContain('koi doctor available nahi')
  })

  it('handles no slots available', async () => {
    bookingService.getAvailableSlots.mockResolvedValue([])
    await send('Hi'); await send('1'); await send('1')
    const reply = await send('1')
    expect(reply).toContain('koi slot available nahi')
  })

  it('shows my bookings', async () => {
    bookingService.getBookingsByPhone.mockResolvedValue([
      { bookingId: 'BK-001', doctorId: { name: 'Dr. Smith' }, slotId: { date: new Date(), startTime: '10:00' }, status: 'pending' }
    ])
    await send('Hi'); await send('2')
    const msgs = mockProvider.sendTextMessage.mock.calls.map(c => c[1])
    expect(msgs.some(m => m.includes('Aapki Bookings'))).toBe(true)
  })

  it('cancels a booking', async () => {
    bookingService.getBookingsByPhone.mockResolvedValue([
      { _id: 'b1', bookingId: 'BK-001', doctorId: { name: 'Dr. Smith' } }
    ])
    bookingService.updateBookingStatus.mockResolvedValue({})
    await send('Hi'); await send('3')
    expect(stateStore[PHONE].currentStep).toBe('CANCEL_SELECT')
    await send('1')
    expect(bookingService.updateBookingStatus).toHaveBeenCalledWith('b1', 'cancelled')
  })

  it('shows no bookings on cancel attempt', async () => {
    await send('Hi'); await send('3')
    const msgs = mockProvider.sendTextMessage.mock.calls.map(c => c[1])
    expect(msgs.some(m => m.includes('koi active booking nahi'))).toBe(true)
  })

  it('shows support info', async () => {
    await send('Hi')
    const reply = await send('4')
    expect(reply).toContain('Support')
  })

  it('handles no messaging provider', async () => {
    conversationService.setProvider(null)
    await expect(send('Hi')).resolves.not.toThrow()
  })

  it('welcomes first-time user on unknown input', async () => {
    const reply = await send('random text')
    expect(reply).toContain('Namaste')
  })

  it('prompts custom date on option 3', async () => {
    await send('Hi'); await send('1'); await send('1')
    const reply = await send('3')
    expect(reply).toContain('DD/MM/YYYY')
  })

  it('handles tomorrow selection', async () => {
    await send('Hi'); await send('1'); await send('1')
    const reply = await send('2')
    expect(reply).toContain('Available Slots')
  })
})
