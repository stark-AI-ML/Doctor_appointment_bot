import MedicineOrder from './medicineOrder.model.js'
import idsService from '../ids/ids.service.js'

class MedicineOrderService {
  async createOrder(data) {
    // Sequential order ID via atomic counter (race-safe, replaces countDocuments)
    const orderId = await idsService.generateMedOrderId()
    return MedicineOrder.create({ ...data, orderId })
  }
}

export default new MedicineOrderService()
