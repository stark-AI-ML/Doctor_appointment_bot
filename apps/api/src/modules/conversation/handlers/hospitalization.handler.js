import conversationRepo from '../conversation.repository.js'
import patientService from '../../patient/patient.service.js'
import { STEPS, MESSAGES } from '../conversation.steps.js'
import { resolveDate } from '../../../utils/dateHelpers.js'

export const hospitalizationHandler = {
  async handleHospName(service, phone, state, input) {
    await conversationRepo.upsert(phone, { currentStep: STEPS.HOSP_AGE, tempName: input })
    return service.sendMessage(phone, MESSAGES.hospAge())
  },

  async handleHospAge(service, phone, state, input) {
    const age = parseInt(input, 10)
    if (isNaN(age) || age < 1 || age > 120) return service.sendMessage(phone, MESSAGES.invalidInput())
    await conversationRepo.upsert(phone, { currentStep: STEPS.HOSP_PROBLEM, tempAge: age })
    return service.sendMessage(phone, MESSAGES.hospProblem())
  },

  async handleHospProblem(service, phone, state, input) {
    await conversationRepo.upsert(phone, { currentStep: STEPS.HOSP_DATE, stateData: { ...state.stateData, problem: input } })
    return service.sendDateOptions(phone, state, (opts) => MESSAGES.hospDate(opts))
  },

  async handleHospDate(service, phone, state, input) {
    const dateOptions = state?.stateData?.dateOptions || []
    let date = null

    const looksLikeDate = /^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/.test(input.trim())
    const idx = parseInt(input, 10)

    if (!looksLikeDate && !isNaN(idx) && idx >= 1 && idx <= dateOptions.length) {
      date = new Date(dateOptions[idx - 1])
    }
    if (!date) date = resolveDate(input)
    if (!date) return service.sendDateOptions(phone, state, (opts) => MESSAGES.hospDate(opts))

    await patientService.registerPatientWithBooking(
      {
        phone,
        name: state.tempName,
        age: state.tempAge,
        preferredDate: new Date(date),
        problemDescription: state.stateData.problem,
        type: 'HOSPITALIZATION',
      },
      { source: 'whatsapp' },
      { validate: false }
    )

    await service.sendMessage(phone, MESSAGES.hospDone())
    await conversationRepo.resetState(phone)
  },
}
