import patientRepo from './patient.repository.js'

class PatientService {
  async findOrCreateByPhone(phone, data = {}) {
    return patientRepo.findOrCreate(phone, data)
  }

  async getPatientById(id) {
    return patientRepo.findById(id)
  }

  async searchPatients(query) {
    return patientRepo.search(query)
  }

  async updatePatient(id, data) {
    return patientRepo.update(id, data)
  }
}

export default new PatientService()
