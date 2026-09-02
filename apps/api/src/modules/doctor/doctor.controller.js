import doctorService from './doctor.service.js'

export const doctorController = {
  async getAll(req, res, next) {
    try {
      const doctors = await doctorService.getAllDoctors()
      res.json(doctors)
    } catch (err) { next(err) }
  },

  async getById(req, res, next) {
    try {
      const doctor = await doctorService.getDoctorById(req.params.id)
      if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })
      res.json(doctor)
    } catch (err) { next(err) }
  },

  async create(req, res, next) {
    try {
      const doctor = await doctorService.createDoctor(req.body)
      res.status(201).json(doctor)
    } catch (err) { next(err) }
  },

  async update(req, res, next) {
    try {
      const doctor = await doctorService.updateDoctor(req.params.id, req.body)
      if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })
      res.json(doctor)
    } catch (err) { next(err) }
  },

  async delete(req, res, next) {
    try {
      await doctorService.deleteDoctor(req.params.id)
      res.json({ success: true })
    } catch (err) { next(err) }
  },

  async toggleActive(req, res, next) {
    try {
      const doctor = await doctorService.toggleActive(req.params.id)
      if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })
      res.json(doctor)
    } catch (err) { next(err) }
  },
}
