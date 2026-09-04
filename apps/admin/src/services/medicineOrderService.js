import api, { isMockMode } from './api'
const mockOrders = []

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
      return { data: mockOrders || [], total: 0, page: 1, limit: 10, totalPages: 1 }
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
      return { success: true }
    }
    const payload = { status }
    if (staffNotes !== undefined) payload.staffNotes = staffNotes
    const { data } = await api.patch(`/medicine-orders/${id}/status`, payload)
    return data
  },
}
