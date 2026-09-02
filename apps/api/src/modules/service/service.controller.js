import serviceService from './service.service.js'

export const serviceController = {
  async getAll(req, res, next) {
    try {
      const services = await serviceService.getAllServices()
      res.json(services)
    } catch (err) { next(err) }
  },

  async getById(req, res, next) {
    try {
      const service = await serviceService.getServiceById(req.params.id)
      if (!service) return res.status(404).json({ success: false, message: 'Service not found' })
      res.json(service)
    } catch (err) { next(err) }
  },

  async create(req, res, next) {
    try {
      const service = await serviceService.createService(req.body)
      res.status(201).json(service)
    } catch (err) { next(err) }
  },

  async update(req, res, next) {
    try {
      const service = await serviceService.updateService(req.params.id, req.body)
      if (!service) return res.status(404).json({ success: false, message: 'Service not found' })
      res.json(service)
    } catch (err) { next(err) }
  },

  async delete(req, res, next) {
    try {
      await serviceService.deleteService(req.params.id)
      res.json({ success: true })
    } catch (err) { next(err) }
  },
}
