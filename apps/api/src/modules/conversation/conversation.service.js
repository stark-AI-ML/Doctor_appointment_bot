import conversationRepo from './conversation.repository.js'
import doctorService from '../doctor/doctor.service.js'
import bookingService from '../booking/booking.service.js'
import patientService from '../patient/patient.service.js'
import { STEPS, MESSAGES } from './conversation.steps.js'
import { resolveDate, formatDateDisplay } from '../../utils/dateHelpers.js'
import logger from '../../utils/logger.js'

class ConversationService {
  constructor() {
    this.messagingProvider = null // set via setProvider()
  }

  /** Inject the messaging provider (called once at startup) */
  setProvider(provider) {
    this.messagingProvider = provider
  }

  /**
   * Main entry point — called by the webhook on every incoming message.
   */
  async handleMessage(phone, body) {
    const input = body.trim()

    // "hi", "hello", "reset", "menu" → always restart
    if (['hi', 'hello', 'hey', 'reset', 'menu', 'start'].includes(input.toLowerCase())) {
      return this.resetAndWelcome(phone)
    }

    // Get or create conversation state
    let state = await conversationRepo.findByPhone(phone)
    if (!state) {
      return this.resetAndWelcome(phone)
    }

    try {
      switch (state.currentStep) {
        case STEPS.WELCOME:       return await this.handleWelcome(phone, state, input)
        case STEPS.SELECT_DOCTOR: return await this.handleSelectDoctor(phone, state, input)
        case STEPS.SELECT_DATE:   return await this.handleSelectDate(phone, state, input)
        case STEPS.SELECT_SLOT:   return await this.handleSelectSlot(phone, state, input)
        case STEPS.ENTER_NAME:    return await this.handleEnterName(phone, state, input)
        case STEPS.ENTER_AGE:     return await this.handleEnterAge(phone, state, input)
        case STEPS.ENTER_GENDER:  return await this.handleEnterGender(phone, state, input)
        case STEPS.CONFIRM:       return await this.handleConfirm(phone, state, input)
        case STEPS.CANCEL_SELECT: return await this.handleCancelSelect(phone, state, input)
        default:                  return this.resetAndWelcome(phone)
      }
    } catch (err) {
      logger.error(`Conversation error for ${phone}:`, err.message)
      await this.sendMessage(phone, 'Kuch gadbad ho gayi. Kripya "hi" bhejkar dubara shuru karein.')
    }
  }

  // ─── Step Handlers ─────────────────────────────────────

  async handleWelcome(phone, state, input) {
    switch (input) {
      case '1': { // Appointment Book
        const doctors = await doctorService.getActiveDoctors()
        if (!doctors.length) {
          return this.sendMessage(phone, 'Abhi koi doctor available nahi hai. Kripya baad mein try karein.')
        }
        // Store doctor list temporarily for index mapping
        await conversationRepo.upsert(phone, { currentStep: STEPS.SELECT_DOCTOR })
        return this.sendMessage(phone, MESSAGES.selectDoctor(doctors))
      }
      case '2': { // My Booking
        const bookings = await bookingService.getBookingsByPhone(phone)
        await this.sendMessage(phone, MESSAGES.myBookings(bookings))
        return this.resetAndWelcome(phone)
      }
      case '3': { // Cancel / Reschedule
        const bookings = await bookingService.getBookingsByPhone(phone)
        if (!bookings.length) {
          await this.sendMessage(phone, 'Aapki koi active booking nahi hai.')
          return this.resetAndWelcome(phone)
        }
        await conversationRepo.upsert(phone, { currentStep: STEPS.CANCEL_SELECT })
        return this.sendMessage(phone, MESSAGES.cancelSelect(bookings))
      }
      case '4': // Support
        return this.sendMessage(phone, MESSAGES.support())
      default:
        return this.sendMessage(phone, MESSAGES.invalidInput() + '\n\n' + MESSAGES.welcome())
    }
  }

  async handleSelectDoctor(phone, state, input) {
    const doctors = await doctorService.getActiveDoctors()
    const idx = parseInt(input, 10) - 1
    if (isNaN(idx) || idx < 0 || idx >= doctors.length) {
      return this.sendMessage(phone, MESSAGES.invalidInput() + '\n\n' + MESSAGES.selectDoctor(doctors))
    }

    const selectedDoctor = doctors[idx]
    await conversationRepo.upsert(phone, {
      currentStep: STEPS.SELECT_DATE,
      selectedDoctorId: selectedDoctor._id,
    })
    return this.sendMessage(phone, MESSAGES.selectDate())
  }

  async handleSelectDate(phone, state, input) {
    // Option 3 = "other date" — user types date on next message
    if (input === '3') {
      return this.sendMessage(phone, 'Kripya date bhejein (DD/MM/YYYY format mein):')
    }

    const date = resolveDate(input)
    if (!date) {
      return this.sendMessage(phone, MESSAGES.invalidInput() + '\n\n' + MESSAGES.selectDate())
    }

    const dateStr = formatDateDisplay(date)

    // Get available slots
    const slots = await bookingService.getAvailableSlots(state.selectedDoctorId, date)
    if (!slots.length) {
      return this.sendMessage(phone, MESSAGES.noSlots(dateStr))
    }

    await conversationRepo.upsert(phone, {
      currentStep: STEPS.SELECT_SLOT,
      selectedDate: date.toISOString(),
    })
    return this.sendMessage(phone, MESSAGES.selectSlot(slots, dateStr))
  }

  async handleSelectSlot(phone, state, input) {
    const slots = await bookingService.getAvailableSlots(state.selectedDoctorId, state.selectedDate)
    const idx = parseInt(input, 10) - 1
    if (isNaN(idx) || idx < 0 || idx >= slots.length) {
      const dateStr = formatDateDisplay(state.selectedDate)
      return this.sendMessage(phone, MESSAGES.invalidInput() + '\n\n' + MESSAGES.selectSlot(slots, dateStr))
    }

    const selectedSlot = slots[idx]

    // Check if patient already exists (returning patient)
    const existingPatient = await patientService.findOrCreateByPhone(phone, { name: 'Unknown' })
    if (existingPatient.name && existingPatient.name !== 'Unknown') {
      // Returning patient — skip name/age/gender, go to confirm
      await conversationRepo.upsert(phone, {
        currentStep: STEPS.CONFIRM,
        selectedSlotId: selectedSlot._id,
        tempName: existingPatient.name,
        tempAge: existingPatient.age,
        tempGender: existingPatient.gender,
      })
      const doctor = await doctorService.getDoctorById(state.selectedDoctorId)
      const dateStr = formatDateDisplay(state.selectedDate)
      return this.sendMessage(phone, MESSAGES.confirm({
        doctorName: doctor.name,
        date: dateStr,
        time: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
      }))
    }

    // New patient — ask name
    await conversationRepo.upsert(phone, {
      currentStep: STEPS.ENTER_NAME,
      selectedSlotId: selectedSlot._id,
    })
    return this.sendMessage(phone, MESSAGES.enterName())
  }

  async handleEnterName(phone, state, input) {
    if (input.length < 2) {
      return this.sendMessage(phone, 'Kripya apna poora naam bhejein:')
    }

    await conversationRepo.upsert(phone, {
      currentStep: STEPS.ENTER_AGE,
      tempName: input,
    })
    return this.sendMessage(phone, MESSAGES.enterAge(input))
  }

  async handleEnterAge(phone, state, input) {
    const age = parseInt(input, 10)
    if (isNaN(age) || age < 1 || age > 120) {
      return this.sendMessage(phone, 'Kripya sahi age bhejein (1-120):')
    }

    await conversationRepo.upsert(phone, {
      currentStep: STEPS.ENTER_GENDER,
      tempAge: age,
    })
    return this.sendMessage(phone, MESSAGES.enterGender())
  }

  async handleEnterGender(phone, state, input) {
    const genderMap = { '1': 'male', '2': 'female', '3': 'other' }
    const gender = genderMap[input]
    if (!gender) {
      return this.sendMessage(phone, MESSAGES.invalidInput() + '\n\n' + MESSAGES.enterGender())
    }

    await conversationRepo.upsert(phone, {
      currentStep: STEPS.CONFIRM,
      tempGender: gender,
    })

    // Refresh state for the confirm message
    const freshState = await conversationRepo.findByPhone(phone)
    const doctor = await doctorService.getDoctorById(freshState.selectedDoctorId)
    const dateStr = formatDateDisplay(freshState.selectedDate)
    const slot = await this.getSlot(freshState.selectedSlotId)

    return this.sendMessage(phone, MESSAGES.confirm({
      doctorName: doctor.name,
      date: dateStr,
      time: `${slot.startTime} - ${slot.endTime}`,
    }))
  }

  async handleConfirm(phone, state, input) {
    if (input === '2') {
      // Change — restart from doctor selection
      const doctors = await doctorService.getActiveDoctors()
      await conversationRepo.upsert(phone, {
        currentStep: STEPS.SELECT_DOCTOR,
        selectedDoctorId: null,
        selectedServiceId: null,
        selectedSlotId: null,
        selectedDate: null,
      })
      return this.sendMessage(phone, MESSAGES.selectDoctor(doctors))
    }

    if (input !== '1') {
      return this.sendMessage(phone, MESSAGES.invalidInput() + '\n\n1. Confirm\n2. Change')
    }

    // Confirm — create the booking
    const patient = await patientService.findOrCreateByPhone(phone, {
      name: state.tempName || 'Unknown',
      age: state.tempAge,
      gender: state.tempGender,
    })

    // Update patient details if they were new
    if (state.tempName && state.tempName !== 'Unknown') {
      await patientService.updatePatient(patient._id, {
        name: state.tempName,
        age: state.tempAge,
        gender: state.tempGender,
      })
    }

    const booking = await bookingService.createBooking({
      doctorId: state.selectedDoctorId,
      patientId: patient._id,
      serviceId: state.selectedServiceId,
      slotId: state.selectedSlotId,
      source: 'whatsapp',
    })

    const doctor = await doctorService.getDoctorById(state.selectedDoctorId)
    const slot = await this.getSlot(state.selectedSlotId)
    const dateStr = formatDateDisplay(state.selectedDate)

    await this.sendMessage(phone, MESSAGES.done({
      bookingId: booking.bookingId,
      doctorName: doctor.name,
      date: dateStr,
      time: `${slot.startTime} - ${slot.endTime}`,
    }))

    // Reset state
    await conversationRepo.resetState(phone)
  }

  async handleCancelSelect(phone, state, input) {
    if (input === '0') {
      return this.resetAndWelcome(phone)
    }

    const bookings = await bookingService.getBookingsByPhone(phone)
    const idx = parseInt(input, 10) - 1
    if (isNaN(idx) || idx < 0 || idx >= bookings.length) {
      return this.sendMessage(phone, MESSAGES.invalidInput() + '\n\n' + MESSAGES.cancelSelect(bookings))
    }

    const booking = bookings[idx]
    await bookingService.updateBookingStatus(booking._id, 'cancelled')
    await this.sendMessage(phone, MESSAGES.cancelled(booking.bookingId))
    return this.resetAndWelcome(phone)
  }

  // ─── Helpers ───────────────────────────────────────────

  async resetAndWelcome(phone) {
    await conversationRepo.resetState(phone)
    return this.sendMessage(phone, MESSAGES.welcome())
  }

  async sendMessage(phone, body) {
    if (!this.messagingProvider) {
      logger.warn('No messaging provider set — message not sent:', body.slice(0, 50))
      return
    }
    await this.messagingProvider.sendTextMessage(phone, body)
  }

  async getSlot(slotId) {
    const TimeSlot = (await import('../booking/timeslot.model.js')).default
    return TimeSlot.findById(slotId)
  }
}

export default new ConversationService()
