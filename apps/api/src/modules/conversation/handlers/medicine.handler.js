import conversationRepo from '../conversation.repository.js'
import patientService from '../../patient/patient.service.js'
import medicineOrderService from '../../medicine/medicineOrder.service.js'
import { STEPS, MESSAGES } from '../conversation.steps.js'
import logger from '../../../utils/logger.js'
import { uploadPrescriptionImage } from '../../../utils/cloudinary.js'
import crypto from 'crypto'

export const medicineHandler = {
  async handleMedPrescription(service, phone, state, message) {
    if (message.type !== 'image') {
      return service.sendMessage(phone, MESSAGES.medStart())
    }
    if (!service.messagingProvider || !service.messagingProvider.downloadMedia) {
      logger.warn('Messaging provider does not support media download')
      return service.sendMessage(phone, 'Media download not supported currently.')
    }

    try {
      const media = await service.messagingProvider.downloadMedia(message.imageId)
      const ext = media.mimeType ? media.mimeType.split('/')[1] || 'jpg' : 'jpg'
      const filename = `rx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`

      const prescriptionUrl = await uploadPrescriptionImage(media.buffer, {
        filename,
        mimeType: media.mimeType || 'image/jpeg',
        ext,
      })

      const patients = await patientService.findAllByPhone(phone)
      if (patients.length > 0) {
        await conversationRepo.upsert(phone, { 
          currentStep: STEPS.MED_WHO_FOR, 
          stateData: { prescriptionUrl } 
        })
        return service.sendMessage(phone, MESSAGES.medWhoFor(patients))
      } else {
        await conversationRepo.upsert(phone, { 
          currentStep: STEPS.MED_NAME, 
          stateData: { prescriptionUrl } 
        })
        return service.sendMessage(phone, MESSAGES.medName())
      }
    } catch (err) {
      logger.error('Failed to download prescription:', err)
      return service.sendMessage(phone, 'Failed to process image. Please try again.')
    }
  },

  async handleMedWhoFor(service, phone, state, input) {
    const patients = await patientService.findAllByPhone(phone)
    const idx = parseInt(input, 10)

    if (!isNaN(idx) && idx >= 1 && idx <= patients.length) {
      const selected = patients[idx - 1]
      await conversationRepo.upsert(phone, {
        currentStep: STEPS.MED_ADDRESS,
        stateData: {
          ...state.stateData,
          patientId: selected._id,
          patientName: selected.name,
          isSelf: true,
        }
      })
      return service.sendMessage(phone, MESSAGES.medAddress())
    } else if (idx === patients.length + 1) {
      await conversationRepo.upsert(phone, {
        currentStep: STEPS.MED_NAME,
        stateData: {
          ...state.stateData,
          isSelf: false,
        }
      })
      return service.sendMessage(phone, MESSAGES.medName())
    }
    return service.sendMessage(phone, MESSAGES.invalidInput())
  },

  async handleMedName(service, phone, state, input) {
    const name = input ? input.trim() : ''
    if (!name || name.length < 2) {
      return service.sendMessage(phone, MESSAGES.invalidInput())
    }

    const patient = await patientService.findOrCreateByPhone(phone, { name })

    await conversationRepo.upsert(phone, {
      currentStep: STEPS.MED_ADDRESS,
      stateData: { ...state.stateData, patientId: patient._id, patientName: patient.name }
    })
    return service.sendMessage(phone, MESSAGES.medAddress())
  },

  async handleMedAddress(service, phone, state, input) {
    const pinMatch = input.match(/\b\d{6}\b/)
    if (!pinMatch) return service.sendMessage(phone, MESSAGES.invalidPinCode())

    let patientId = state.stateData?.patientId
    if (!patientId) {
      const patientName = state.stateData?.patientName || 'Patient'
      const patient = await patientService.findOrCreateByPhone(phone, { name: patientName })
      patientId = patient._id
    }
    
    await medicineOrderService.createOrder({
      patientId,
      deliveryAddress: input,
      pinCode: pinMatch[0],
      prescriptionUrl: state.stateData.prescriptionUrl
    })

    await service.sendMessage(phone, MESSAGES.medDone())
    await conversationRepo.resetState(phone)
  },
}
