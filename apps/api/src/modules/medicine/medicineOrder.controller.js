import medicineOrderService from './medicineOrder.service.js'
import MedicineOrder from './medicineOrder.model.js'
import bookingRepo from '../booking/booking.repository.js'
import { uploadPrescriptionImage } from '../../utils/cloudinary.js'

class MedicineOrderController {
  async getOrders(req, res) {
    const { page = 1, limit = 10, status, search } = req.query
    const filter = {}
    if (status) filter.status = status
    // Doctors see only orders linked to their own patients.
    if (req.admin?.role === 'doctor') {
      if (!req.admin.doctorId) {
        return res.status(403).json({ success: false, message: 'No doctor profile linked to this login' })
      }
      filter.patientId = { $in: await bookingRepo.findDistinctPatientIdsByDoctor(req.admin.doctorId) }
    }
    // Add search logic if needed

    const skip = (page - 1) * limit
    const orders = await MedicineOrder.find(filter)
      .populate('patientId', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await MedicineOrder.countDocuments(filter)

    res.json({
      data: orders,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    })
  }

  async updateStatus(req, res) {
    // Receptionists get read-only access (desk queries: "where is my medicine?")
    if (req.admin?.role === 'receptionist') {
      return res.status(403).json({ success: false, message: 'Forbidden: receptionists have read-only access to medicine orders' })
    }
    const { id } = req.params
    const { status, staffNotes } = req.body

    const updateData = { status }
    if (staffNotes !== undefined) updateData.staffNotes = staffNotes

    const order = await MedicineOrder.findByIdAndUpdate(id, updateData, { new: true })
    if (!order) return res.status(404).json({ message: 'Order not found' })

    res.json(order)
  }

  async uploadPrescription(req, res) {
    const { imageBase64, filename } = req.body
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'imageBase64 parameter is required' })
    }
    const secureUrl = await uploadPrescriptionImage(imageBase64, { filename })
    res.json({ success: true, url: secureUrl })
  }
}

export default new MedicineOrderController()
