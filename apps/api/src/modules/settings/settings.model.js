import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
  clinic_name:                   { type: String, default: 'DocBot Clinic' },
  clinic_phone:                  { type: String, default: '' },
  clinic_address:                { type: String, default: '' },
  whatsapp_number:               { type: String, default: '' },
  whatsapp_api_status:           { type: String, default: 'connected' },
  notification_booking_confirm:  { type: Boolean, default: true },
  notification_booking_reminder: { type: Boolean, default: true },
  notification_booking_cancel:   { type: Boolean, default: true },
}, { timestamps: true })

settingsSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

const Settings = mongoose.model('Settings', settingsSchema)

/**
 * Singleton pattern — always returns the single settings document.
 * Creates default settings on first access.
 */
export async function getSettings() {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create({})
  }
  return settings
}

export async function updateSettings(data) {
  let settings = await Settings.findOne()
  if (!settings) {
    settings = await Settings.create(data)
  } else {
    Object.assign(settings, data)
    await settings.save()
  }
  return settings
}

export default Settings
