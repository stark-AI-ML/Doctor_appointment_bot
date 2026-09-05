import conversationRepo from './conversation.repository.js'
import doctorService from '../doctor/doctor.service.js'
import bookingService from '../booking/booking.service.js'
import patientService from '../patient/patient.service.js'
import departmentService from '../department/department.service.js'
import medicineOrderService from '../medicine/medicineOrder.service.js'
import { STEPS, MESSAGES } from './conversation.steps.js'
import { resolveDate } from '../../utils/dateHelpers.js'
import logger from '../../utils/logger.js'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const getId = (obj) => obj._id || obj.id

class ConversationService {
  constructor() {
    this.messagingProvider = null
  }

  setProvider(provider) {
    this.messagingProvider = provider
  }

  async handleMessage(phone, message) {
    const isImage = message.type === 'image'
    const input = isImage ? '' : message.body.trim()

    // Global Reset
    if (!isImage) {
      const lower = input.toLowerCase()
      const greetings = ['hi', 'hello', 'hey', 'reset', 'menu', 'start', '00']
      if (greetings.some(g => lower === g || (g !== '00' && lower.startsWith(g)))) {
        return this.resetAndWelcome(phone)
      }
    }

    let state = await conversationRepo.findByPhone(phone)
    if (!state) {
      return this.resetAndWelcome(phone)
    }

    // Handle "Back" (0)
    if (!isImage && input === '0' && state.currentStep !== STEPS.WELCOME) {
      return this.handleBack(phone, state)
    }

    try {
      if (isImage && state.currentStep !== STEPS.MED_PRESCRIPTION) {
        return this.sendMessage(phone, MESSAGES.invalidInput())
      }

      switch (state.currentStep) {
        case STEPS.WELCOME:          return await this.handleWelcome(phone, state, input)
        // OPD Flow
        case STEPS.OPD_DEPARTMENT:   return await this.handleOpdDepartment(phone, state, input)
        case STEPS.OPD_DOCTOR:       return await this.handleOpdDoctor(phone, state, input)
        case STEPS.SELECT_DATE:      return await this.handleSelectDate(phone, state, input)
        case STEPS.WHO_FOR:          return await this.handleWhoFor(phone, state, input)
        case STEPS.PATIENT_NAME:     return await this.handlePatientName(phone, state, input)
        case STEPS.PATIENT_MOBILE:   return await this.handlePatientMobile(phone, state, input)
        case STEPS.PATIENT_AGE:      return await this.handlePatientAge(phone, state, input)
        case STEPS.PATIENT_GENDER:   return await this.handlePatientGender(phone, state, input)
        case STEPS.PATIENT_DISTRICT: return await this.handlePatientDistrict(phone, state, input)
        case STEPS.PATIENT_ADDRESS:  return await this.handlePatientAddress(phone, state, input)
        case STEPS.PATIENT_PROBLEM:  return await this.handlePatientProblem(phone, state, input)
        case STEPS.REVIEW:           return await this.handleReview(phone, state, input)
        
        // Hospitalization Flow
        case STEPS.HOSP_NAME:        return await this.handleHospName(phone, state, input)
        case STEPS.HOSP_AGE:         return await this.handleHospAge(phone, state, input)
        case STEPS.HOSP_PROBLEM:     return await this.handleHospProblem(phone, state, input)
        case STEPS.HOSP_DATE:        return await this.handleHospDate(phone, state, input)
        
        // Medicine Flow
        case STEPS.MED_PRESCRIPTION: return await this.handleMedPrescription(phone, state, message)
        case STEPS.MED_ADDRESS:      return await this.handleMedAddress(phone, state, input)
        
        default:                     return this.resetAndWelcome(phone)
      }
    } catch (err) {
      logger.error(`Conversation error for ${phone}:`, err.message)
      await this.sendMessage(phone, 'Error processing request. Please type "menu".')
    }
  }

  async handleBack(phone, state) {
    // Determine previous step based on currentStep
    // For simplicity, just reset to menu for now if they hit back in deeper flows
    if (state.currentStep === STEPS.OPD_DOCTOR) {
      const deps = await departmentService.getActiveDepartments()
      await conversationRepo.upsert(phone, { currentStep: STEPS.OPD_DEPARTMENT })
      return this.sendMessage(phone, MESSAGES.departments(deps))
    }
    if (state.currentStep === STEPS.SELECT_DATE) {
      const deps = await departmentService.getActiveDepartments()
      // If we don't know dept, go to department
      const selectedDoc = await doctorService.getDoctorById(state.selectedDoctorId)
      const docs = await doctorService.getDoctorsByDepartment(selectedDoc.departmentId)
      await conversationRepo.upsert(phone, { currentStep: STEPS.OPD_DOCTOR })
      return this.sendMessage(phone, MESSAGES.doctors('Doctors', docs))
    }
    return this.resetAndWelcome(phone)
  }

  // ─── Main Menu ─────────────────────────────────────────

  async handleWelcome(phone, state, input) {
    switch (input) {
      case '1': { // OPD
        const deps = await departmentService.getActiveDepartments()
        if (!deps.length) {
          // fallback if no departments
          await conversationRepo.upsert(phone, { currentFlow: 'OPD_BOOKING', currentStep: STEPS.OPD_DOCTOR })
          const docs = await doctorService.getActiveDoctors()
          return this.sendMessage(phone, MESSAGES.doctors('All Doctors', docs))
        }
        await conversationRepo.upsert(phone, { currentFlow: 'OPD_BOOKING', currentStep: STEPS.OPD_DEPARTMENT })
        return this.sendMessage(phone, MESSAGES.departments(deps))
      }
      case '2': // Hospitalization
        await conversationRepo.upsert(phone, { currentFlow: 'HOSPITALIZATION', currentStep: STEPS.HOSP_NAME })
        return this.sendMessage(phone, MESSAGES.hospStart())
      case '3': // Medicine Order
        await conversationRepo.upsert(phone, { currentFlow: 'MEDICINE', currentStep: STEPS.MED_PRESCRIPTION })
        return this.sendMessage(phone, MESSAGES.medStart())
      case '4': // General Query
        return this.sendMessage(phone, MESSAGES.info())
      case '5': // Support
        return this.sendMessage(phone, MESSAGES.support())
      case '6': // Email Help
        return this.sendMessage(phone, MESSAGES.email())
      default:
        return this.sendMessage(phone, MESSAGES.invalidInput())
    }
  }

  // ─── OPD Flow ──────────────────────────────────────────

  async handleOpdDepartment(phone, state, input) {
    const deps = await departmentService.getActiveDepartments()
    const idx = parseInt(input, 10) - 1
    if (isNaN(idx) || idx < 0 || idx >= deps.length) return this.sendMessage(phone, MESSAGES.invalidInput())
    
    const selectedDept = deps[idx]
    let docs = await doctorService.getDoctorsByDepartment(getId(selectedDept))
    
    if (!docs.length) {
      // If no docs mapped properly, just show all for demo
      docs = await doctorService.getActiveDoctors()
    }
    
    await conversationRepo.upsert(phone, {
      currentStep: STEPS.OPD_DOCTOR,
      stateData: { departmentId: getId(selectedDept), departmentName: selectedDept.name }
    })
    return this.sendMessage(phone, MESSAGES.doctors(selectedDept.name, docs))
  }

  async handleOpdDoctor(phone, state, input) {
    let docs
    const deptId = state?.stateData?.departmentId
    if (deptId) {
      docs = await doctorService.getDoctorsByDepartment(deptId)
      if (!docs.length) docs = await doctorService.getActiveDoctors()
    } else {
      docs = await doctorService.getActiveDoctors()
    }
    const idx = parseInt(input, 10) - 1
    if (isNaN(idx) || idx < 0 || idx >= docs.length) return this.sendMessage(phone, MESSAGES.invalidInput())
    
    const selectedDoctor = docs[idx]
    await conversationRepo.upsert(phone, {
      currentStep: STEPS.SELECT_DATE,
      selectedDoctorId: getId(selectedDoctor)
    })
    return this.sendDatePicker(phone, MESSAGES.selectDate(selectedDoctor.name))
  }

  async handleSelectDate(phone, state, input) {
    const date = resolveDate(input)
    if (!date) return this.sendDatePicker(phone, MESSAGES.invalidInput() + '\n(Use DD/MM/YYYY)')
    
    const dateStr = date.toLocaleDateString('en-IN')
    
    // Check if patient exists
    const existingPatient = await patientService.findOrCreateByPhone(phone, { name: 'Unknown' })
    
    await conversationRepo.upsert(phone, {
      selectedDate: date.toISOString(),
      stateData: { ...state.stateData, dateStr }
    })

    if (existingPatient.name && existingPatient.name !== 'Unknown') {
      await conversationRepo.upsert(phone, { currentStep: STEPS.WHO_FOR })
      return this.sendMessage(phone, MESSAGES.whoFor(existingPatient.name))
    } else {
      await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_NAME })
      return this.sendMessage(phone, MESSAGES.patientName())
    }
  }

  async handleWhoFor(phone, state, input) {
    if (input === '1') {
      const existingPatient = await patientService.findOrCreateByPhone(phone, { name: 'Unknown' })
      await conversationRepo.upsert(phone, {
        currentStep: STEPS.PATIENT_PROBLEM,
        tempName: existingPatient.name,
        tempAge: existingPatient.age,
        tempGender: existingPatient.gender,
        stateData: { 
          ...state.stateData, 
          district: existingPatient.district || 'N/A', 
          address: 'N/A' 
        }
      })
      return this.sendMessage(phone, MESSAGES.patientProblem())
    } else if (input === '2') {
      await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_NAME })
      return this.sendMessage(phone, MESSAGES.patientName())
    }
    return this.sendMessage(phone, MESSAGES.invalidInput())
  }

  async handlePatientName(phone, state, input) {
    if (input.length < 2) return this.sendMessage(phone, MESSAGES.invalidInput())
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_MOBILE, tempName: input })
    return this.sendMessage(phone, MESSAGES.patientMobile())
  }

  async handlePatientMobile(phone, state, input) {
    const cleanNum = input.replace(/\\D/g, '')
    if (cleanNum.length < 10) return this.sendMessage(phone, MESSAGES.invalidInput())
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_AGE, stateData: { ...state.stateData, mobile: input } })
    return this.sendMessage(phone, MESSAGES.patientAge())
  }

  async handlePatientAge(phone, state, input) {
    const age = parseInt(input, 10)
    if (isNaN(age) || age < 1 || age > 120) return this.sendMessage(phone, MESSAGES.invalidInput())
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_GENDER, tempAge: age })
    return this.sendMessage(phone, MESSAGES.patientGender())
  }

  async handlePatientGender(phone, state, input) {
    const genderMap = { '1': 'Male', '2': 'Female', '3': 'Other' }
    const gender = genderMap[input]
    if (!gender) return this.sendMessage(phone, MESSAGES.invalidInput())
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_DISTRICT, tempGender: gender })
    return this.sendMessage(phone, MESSAGES.patientDistrict())
  }

  async handlePatientDistrict(phone, state, input) {
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_ADDRESS, stateData: { ...state.stateData, district: input } })
    return this.sendMessage(phone, MESSAGES.patientAddress())
  }

  async handlePatientAddress(phone, state, input) {
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_PROBLEM, stateData: { ...state.stateData, address: input } })
    return this.sendMessage(phone, MESSAGES.patientProblem())
  }

  async handlePatientProblem(phone, state, input) {
    await conversationRepo.upsert(phone, { currentStep: STEPS.REVIEW, stateData: { ...state.stateData, problem: input } })
    
    const freshState = await conversationRepo.findByPhone(phone)
    const doctor = await doctorService.getDoctorById(freshState.selectedDoctorId)
    
    return this.sendMessage(phone, MESSAGES.review({
      doctorName: doctor.name,
      date: freshState.stateData.dateStr,
      name: freshState.tempName,
      mobile: freshState.stateData.mobile || phone,
      age: freshState.tempAge,
      gender: freshState.tempGender,
      district: freshState.stateData.district,
      address: freshState.stateData.address,
      problem: freshState.stateData.problem,
    }))
  }

  async handleReview(phone, state, input) {
    if (input === '2') {
      await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_NAME })
      return this.sendMessage(phone, MESSAGES.patientName())
    }
    if (input !== '1') return this.sendMessage(phone, MESSAGES.invalidInput())

    // Confirm & Create OPD Booking
    const patient = await patientService.findOrCreateByPhone(phone, {
      name: state.tempName,
      age: state.tempAge,
      gender: state.tempGender,
      district: state.stateData.district,
    })

    const doctor = await doctorService.getDoctorById(state.selectedDoctorId)
    
    // Generate a quick random token number for now since bookingService does not expose count
    const tokenNumber = `TKN-${Math.floor(100 + Math.random() * 900)}`

    const booking = await bookingService.createBooking({
      doctorId: state.selectedDoctorId,
      departmentId: state.stateData.departmentId,
      patientId: patient._id,
      preferredDate: new Date(state.selectedDate),
      problemDescription: state.stateData.problem,
      type: 'OPD',
      source: 'whatsapp',
      tokenNumber
    })

    await this.sendMessage(phone, MESSAGES.appointmentConfirmed({
      tokenNumber: booking.tokenNumber,
      uhid: patient.uhid || 'KGN-NEW',
      doctorName: doctor.name,
      date: state.stateData.dateStr,
      name: state.tempName,
      mobile: phone
    }))

    await conversationRepo.resetState(phone)
  }

  // ─── Hospitalization Flow ──────────────────────────────

  async handleHospName(phone, state, input) {
    await conversationRepo.upsert(phone, { currentStep: STEPS.HOSP_AGE, tempName: input })
    return this.sendMessage(phone, MESSAGES.hospAge())
  }

  async handleHospAge(phone, state, input) {
    await conversationRepo.upsert(phone, { currentStep: STEPS.HOSP_PROBLEM, tempAge: input })
    return this.sendMessage(phone, MESSAGES.hospProblem())
  }

  async handleHospProblem(phone, state, input) {
    await conversationRepo.upsert(phone, { currentStep: STEPS.HOSP_DATE, stateData: { problem: input } })
    return this.sendMessage(phone, MESSAGES.hospDate())
  }

  async handleHospDate(phone, state, input) {
    const date = resolveDate(input)
    if (!date) return this.sendDatePicker(phone, MESSAGES.hospDate())

    const patient = await patientService.findOrCreateByPhone(phone, { name: state.tempName, age: state.tempAge })
    
    await bookingService.createBooking({
      patientId: patient._id,
      preferredDate: new Date(date),
      problemDescription: state.stateData.problem,
      type: 'HOSPITALIZATION',
      source: 'whatsapp',
    })

    await this.sendMessage(phone, MESSAGES.hospDone())
    await conversationRepo.resetState(phone)
  }

  // ─── Medicine Order Flow ───────────────────────────────

  async handleMedPrescription(phone, state, message) {
    if (!this.messagingProvider.downloadMedia) {
      logger.warn('Messaging provider does not support media download')
      return this.sendMessage(phone, 'Media download not supported currently.')
    }

    try {
      const media = await this.messagingProvider.downloadMedia(message.imageId)
      const ext = media.mimeType.split('/')[1] || 'jpg'
      const filename = `rx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
      
      const filepath = path.join(uploadDir, filename)
      fs.writeFileSync(filepath, media.buffer)
      
      const prescriptionUrl = `/uploads/${filename}`
      
      await conversationRepo.upsert(phone, { 
        currentStep: STEPS.MED_ADDRESS, 
        stateData: { prescriptionUrl } 
      })
      return this.sendMessage(phone, MESSAGES.medAddress())
    } catch (err) {
      logger.error('Failed to download prescription:', err)
      return this.sendMessage(phone, 'Failed to process image. Please try again.')
    }
  }

  async handleMedAddress(phone, state, input) {
    const patient = await patientService.findOrCreateByPhone(phone, { name: 'Unknown' })
    
    await medicineOrderService.createOrder({
      patientId: patient._id,
      deliveryAddress: input,
      prescriptionUrl: state.stateData.prescriptionUrl
    })

    await this.sendMessage(phone, MESSAGES.medDone())
    await conversationRepo.resetState(phone)
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

  async sendDatePicker(phone, body) {
    if (!this.messagingProvider) {
      logger.warn('No messaging provider set — date picker not sent:', body.slice(0, 50))
      return
    }
    try {
      await this.messagingProvider.sendDateTimeMessage(phone, body)
    } catch (err) {
      // Provider doesn't support interactive messages (e.g. Twilio) → fall back to text
      logger.warn(`Date picker not supported — falling back to text: ${err.message}`)
      await this.sendMessage(phone, body)
    }
  }
}

export default new ConversationService()
