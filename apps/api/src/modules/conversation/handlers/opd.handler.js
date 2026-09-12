import conversationRepo from '../conversation.repository.js'
import doctorService from '../../doctor/doctor.service.js'
import patientService from '../../patient/patient.service.js'
import departmentService from '../../department/department.service.js'
import { STEPS, MESSAGES } from '../conversation.steps.js'
import { resolveDate } from '../../../utils/dateHelpers.js'

const getId = (obj) => obj._id || obj.id

export const opdHandler = {
  async handleOpdDepartment(service, phone, state, input) {
    const deps = await departmentService.getActiveDepartments()
    const idx = parseInt(input, 10) - 1
    if (isNaN(idx) || idx < 0 || idx >= deps.length) return service.sendMessage(phone, MESSAGES.invalidInput())
    
    const selectedDept = deps[idx]
    let docs = await doctorService.getDoctorsByDepartment(getId(selectedDept))
    
    if (!docs.length) {
      docs = await doctorService.getActiveDoctors()
    }
    
    await conversationRepo.upsert(phone, {
      currentStep: STEPS.OPD_DOCTOR,
      stateData: { departmentId: getId(selectedDept), departmentName: selectedDept.name }
    })
    return service.sendMessage(phone, MESSAGES.doctors(selectedDept.name, docs))
  },

  async handleOpdDoctor(service, phone, state, input) {
    let docs
    const deptId = state?.stateData?.departmentId
    if (deptId) {
      docs = await doctorService.getDoctorsByDepartment(deptId)
      if (!docs.length) docs = await doctorService.getActiveDoctors()
    } else {
      docs = await doctorService.getActiveDoctors()
    }
    const idx = parseInt(input, 10) - 1
    if (isNaN(idx) || idx < 0 || idx >= docs.length) return service.sendMessage(phone, MESSAGES.invalidInput())
    
    const selectedDoctor = docs[idx]
    await conversationRepo.upsert(phone, {
      currentStep: STEPS.SELECT_DATE,
      selectedDoctorId: getId(selectedDoctor)
    })
    return service.sendDateOptions(phone, state, (opts) => MESSAGES.selectDate(selectedDoctor.name, opts))
  },

  async handleSelectDate(service, phone, state, input) {
    const dateOptions = state?.stateData?.dateOptions || []
    let date = null

    const looksLikeDate = /^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/.test(input.trim())
    const idx = parseInt(input, 10)

    if (!looksLikeDate && !isNaN(idx) && idx >= 1 && idx <= dateOptions.length) {
      date = new Date(dateOptions[idx - 1])
    }

    if (!date) date = resolveDate(input)

    if (!date) {
      const doctor = await doctorService.getDoctorById(state.selectedDoctorId)
      return service.sendDateOptions(phone, state, (opts) => MESSAGES.selectDate(doctor?.name || 'Doctor', opts))
    }
    
    const dateStr = date.toLocaleDateString('en-IN')
    
    const patients = await patientService.findAllByPhone(phone)
    
    await conversationRepo.upsert(phone, {
      selectedDate: date.toISOString(),
      stateData: { ...state.stateData, dateStr }
    })

    if (patients.length > 0) {
      await conversationRepo.upsert(phone, { currentStep: STEPS.WHO_FOR })
      return service.sendMessage(phone, MESSAGES.whoFor(patients))
    } else {
      await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_NAME })
      return service.sendMessage(phone, MESSAGES.patientName())
    }
  },

  async handleWhoFor(service, phone, state, input) {
    const patients = await patientService.findAllByPhone(phone)
    const idx = parseInt(input, 10)

    if (!isNaN(idx) && idx >= 1 && idx <= patients.length) {
      const selected = patients[idx - 1]
      await conversationRepo.upsert(phone, {
        currentStep: STEPS.PATIENT_TYPE,
        tempName: selected.name,
        tempAge: selected.age,
        tempGender: selected.gender,
        stateData: { 
          ...state.stateData,
          isExistingPatient: true,
          isOld: selected.isOld ?? true,
          district: selected.district || 'N/A', 
          address: selected.address || 'N/A' 
        }
      })
      return service.sendMessage(phone, MESSAGES.patientType(selected.name))
    } else if (idx === patients.length + 1) {
      await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_NAME })
      return service.sendMessage(phone, MESSAGES.patientName())
    }
    return service.sendMessage(phone, MESSAGES.invalidInput())
  },

  async handlePatientName(service, phone, state, input) {
    if (input.length < 2) return service.sendMessage(phone, MESSAGES.invalidInput())
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_MOBILE, tempName: input })
    return service.sendMessage(phone, MESSAGES.patientMobile())
  },

  async handlePatientMobile(service, phone, state, input) {
    const cleanNum = input.replace(/\D/g, '')
    if (cleanNum.length !== 10) return service.sendMessage(phone, MESSAGES.invalidMobile())
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_AGE, stateData: { ...state.stateData, mobile: cleanNum } })
    return service.sendMessage(phone, MESSAGES.patientAge())
  },

  async handlePatientAge(service, phone, state, input) {
    const age = parseInt(input, 10)
    if (isNaN(age) || age < 1 || age > 120) return service.sendMessage(phone, MESSAGES.invalidInput())
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_GENDER, tempAge: age })
    return service.sendMessage(phone, MESSAGES.patientGender())
  },

  async handlePatientGender(service, phone, state, input) {
    const genderMap = { '1': 'Male', '2': 'Female', '3': 'Other' }
    const gender = genderMap[input]
    if (!gender) return service.sendMessage(phone, MESSAGES.invalidInput())
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_TYPE, tempGender: gender })
    return service.sendMessage(phone, MESSAGES.patientType(state.tempName))
  },

  async handlePatientType(service, phone, state, input) {
    let isOld = false
    if (input === '1') isOld = true
    else if (input === '2') isOld = false
    else return service.sendMessage(phone, MESSAGES.invalidInput())

    const isExisting = state.stateData?.isExistingPatient === true
    const hasAddress = Boolean(state.stateData?.district && state.stateData?.district !== 'N/A' && state.stateData?.address && state.stateData?.address !== 'N/A')
    const nextStep = (isExisting && hasAddress) ? STEPS.PATIENT_PROBLEM : STEPS.PATIENT_DISTRICT

    await conversationRepo.upsert(phone, {
      currentStep: nextStep,
      stateData: { ...state.stateData, isOld }
    })

    if (isExisting && hasAddress) {
      return service.sendMessage(phone, MESSAGES.patientProblem())
    }
    return service.sendMessage(phone, MESSAGES.patientDistrict())
  },

  async handlePatientDistrict(service, phone, state, input) {
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_ADDRESS, stateData: { ...state.stateData, district: input } })
    return service.sendMessage(phone, MESSAGES.patientAddress())
  },

  async handlePatientAddress(service, phone, state, input) {
    const pinMatch = input.match(/\b\d{6}\b/)
    if (!pinMatch) return service.sendMessage(phone, MESSAGES.invalidPinCode())
    await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_PROBLEM, stateData: { ...state.stateData, address: input, pinCode: pinMatch[0] } })
    return service.sendMessage(phone, MESSAGES.patientProblem())
  },

  async handlePatientProblem(service, phone, state, input) {
    await conversationRepo.upsert(phone, { currentStep: STEPS.REVIEW, stateData: { ...state.stateData, problem: input } })
    
    const freshState = await conversationRepo.findByPhone(phone)
    const doctor = await doctorService.getDoctorById(freshState.selectedDoctorId)
    
    return service.sendMessage(phone, MESSAGES.review({
      doctorName: doctor.name,
      date: freshState.stateData.dateStr,
      name: freshState.tempName,
      mobile: freshState.stateData.mobile || phone,
      age: freshState.tempAge,
      gender: freshState.tempGender,
      isOld: freshState.stateData.isOld,
      district: freshState.stateData.district,
      address: freshState.stateData.address,
      problem: freshState.stateData.problem,
    }))
  },

  async handleReview(service, phone, state, input) {
    if (input === '2') {
      await conversationRepo.upsert(phone, { currentStep: STEPS.PATIENT_NAME })
      return service.sendMessage(phone, MESSAGES.patientName())
    }
    if (input !== '1') return service.sendMessage(phone, MESSAGES.invalidInput())

    const doctorCheck = await doctorService.getDoctorById(state.selectedDoctorId)
    if (!doctorCheck || doctorCheck.isActive === false) {
      await conversationRepo.upsert(phone, { currentStep: STEPS.OPD_DEPARTMENT })
      return service.sendMessage(phone, MESSAGES.doctorUnavailable())
    }

    const { patient, booking } = await patientService.registerPatientWithBooking(
      {
        phone,
        name: state.tempName,
        age: state.tempAge,
        gender: state.tempGender,
        isOld: state.stateData.isOld,
        district: state.stateData.district,
        address: state.stateData.address,
        pinCode: state.stateData.pinCode || '',
        doctorId: state.selectedDoctorId,
        departmentId: state.stateData.departmentId,
        preferredDate: state.selectedDate,
        problemDescription: state.stateData.problem,
        type: 'OPD',
      },
      { source: 'whatsapp' },
      { validate: false }
    )

    const doctor = await doctorService.getDoctorById(state.selectedDoctorId)

    await service.sendMessage(phone, MESSAGES.appointmentConfirmed({
      tokenNumber: booking.tokenNumber,
      uhid: patient.uhid || 'KGN-NEW',
      doctorName: doctor.name,
      date: state.stateData.dateStr,
      name: state.tempName,
      mobile: phone
    }))

    await conversationRepo.resetState(phone)
  },
}
