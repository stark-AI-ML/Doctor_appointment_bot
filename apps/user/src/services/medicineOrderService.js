import api, { isMockMode } from './api'
import { mockMedicineOrders } from '../data/mockData'

const MOCK_DELAY = 300

function normalizeOrder(o) {
  return {
    id: o._id || o.id,
    order_id: o.orderId,
    patient_name: o.patientId?.name || 'Unknown',
    mobile: o.patientId?.phone || '',
    address: o.deliveryAddress || '',
    prescription_url: o.prescriptionUrl || '',
    customer_notes: o.customerNotes || '',
    status: o.status || 'pending',
    staff_notes: o.staffNotes || '',
    created_at: o.createdAt,
  }
}

export const medicineOrderService = {
  async getOrders(params = {}) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      let list = [...mockMedicineOrders]
      if (params.search) {
        const q = params.search.toLowerCase()
        list = list.filter(
          (o) =>
            o.patient_name.toLowerCase().includes(q) ||
            o.order_id.toLowerCase().includes(q)
        )
      }
      return { data: list, total: list.length, page: 1, limit: 10, totalPages: 1 }
    }
    const { data } = await api.get('/medicine-orders', { params })
    return {
      ...data,
      data: (data.data || []).map(normalizeOrder),
    }
  },

  async updateStatus(id, status, staffNotes = undefined) {
    if (isMockMode()) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY))
      const order = mockMedicineOrders.find((o) => o.id === Number(id))
      if (!order) throw new Error('Order not found')
      order.status = status
      if (staffNotes !== undefined) order.staff_notes = staffNotes
      return { success: true, order }
    }
    const payload = { status }
    if (staffNotes !== undefined) payload.staffNotes = staffNotes
    const { data } = await api.patch(`/medicine-orders/${id}/status`, payload)
    return data
  },
}
