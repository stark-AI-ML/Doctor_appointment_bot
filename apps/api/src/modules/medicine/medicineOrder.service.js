import MedicineOrder from './medicineOrder.model.js'
import path from 'path'
import fs from 'fs'

class MedicineOrderService {
  async createOrder(data) {
    // Generate a sequential order ID (Mock logic for now, should use counter)
    const count = await MedicineOrder.countDocuments()
    const orderId = `MED-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`
    
    return MedicineOrder.create({
      ...data,
      orderId
    })
  }
}

export default new MedicineOrderService()
