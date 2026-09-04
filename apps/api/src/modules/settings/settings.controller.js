import { getSettings, updateSettings } from './settings.model.js'

export const settingsController = {
  async get(req, res, next) {
    try {
      const settings = await getSettings()
      res.json(settings)
    } catch (err) { next(err) }
  },

  async update(req, res, next) {
    try {
      const settings = await updateSettings(req.body)
      res.json(settings)
    } catch (err) { next(err) }
  },
}
