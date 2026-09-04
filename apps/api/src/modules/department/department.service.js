import Department from './department.model.js'

class DepartmentService {
  async getActiveDepartments() {
    return Department.find({ isActive: true }).sort({ name: 1 })
  }

  async createDepartment(data) {
    return Department.create(data)
  }
}

export default new DepartmentService()
