import medicineOrderService from './medicineOrder.service.js'
import MedicineOrder from './medicineOrder.model.js'

class MedicineOrderController {
  async getOrders(req, res) {
    const { page = 1, limit = 10, status, search } = req.query
    const filter = {}
    if (status) filter.status = status
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
    const { id } = req.params
    const { status, staffNotes } = req.body

    const updateData = { status }
    if (staffNotes !== undefined) updateData.staffNotes = staffNotes

    const order = await MedicineOrder.findByIdAndUpdate(id, updateData, { new: true })
    if (!order) return res.status(404).json({ message: 'Order not found' })

    res.json(order)
  }
}

export default new MedicineOrderController()
