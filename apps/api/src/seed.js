import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import env from './config/env.js'
import logger from './utils/logger.js'

import Admin from './modules/admin/admin.model.js'
import Doctor from './modules/doctor/doctor.model.js'
import Service from './modules/service/service.model.js'
import TimeSlot from './modules/booking/timeslot.model.js'
import Department from './modules/department/department.model.js'
import Booking from './modules/booking/booking.model.js'
import Patient from './modules/patient/patient.model.js'
import MedicineOrder from './modules/medicine/medicineOrder.model.js'

async function seed() {
  try {
    logger.info('Connecting to MongoDB...')
    await mongoose.connect(env.mongoUri)
    logger.info('Connected!')

    logger.info('Clearing existing data...')
    await Promise.all([
      Admin.deleteMany({}),
      Doctor.deleteMany({}),
      Service.deleteMany({}),
      TimeSlot.deleteMany({}),
      Department.deleteMany({}),
      Booking.deleteMany({}),
      Patient.deleteMany({}),
      MedicineOrder.deleteMany({}),
    ])

    logger.info('Seeding Admin...')
    const passwordHash = await bcrypt.hash('admin123', 10)
    await Admin.create({
      name: 'Super Admin',
      email: 'admin@docbot.com',
      passwordHash,
      role: 'superadmin',
    })

    logger.info('Seeding Departments...')
    const deptsData = [
      { name: 'Gynecology & Obstetrics / स्त्री एवं प्रसूति रोग' },
      { name: 'General Consultation / सामान्य परामर्श' },
      { name: 'ENT / कान, नाक एवं गला' },
      { name: 'Orthopedics / हड्डी एवं जोड़ रोग' },
      { name: 'General Surgery / सामान्य शल्य चिकित्सा' },
      { name: 'Pediatrics / बाल रोग' },
      { name: 'Urology / मूत्र रोग विभाग' },
    ]
    const depts = await Department.insertMany(deptsData)

    const getDeptId = (namePart) => depts.find(d => d.name.includes(namePart))._id

    logger.info('Seeding Doctors...')
    const doctorsData = [
      // Gynecology
      { departmentId: getDeptId('Gynecology'), name: 'Anand Prakash Tiwari', qualifications: 'M.S. (Obs & Gynae)\nSenior Gynaecologist & Infertility Specialist\nEx-Asst. Professor (J.A.M.C.H.)', specialization: 'Gynecologist', gender: 'male', consultationFee: 500 },
      { departmentId: getDeptId('Gynecology'), name: 'Vandana', qualifications: 'BMS', specialization: 'Gynecologist', gender: 'female', consultationFee: 300 },
      { departmentId: getDeptId('Gynecology'), name: 'Sadhana', qualifications: 'BMS', specialization: 'Gynecologist', gender: 'female', consultationFee: 300 },
      
      // General Consultation
      { departmentId: getDeptId('General Consultation'), name: 'Abhishek Kumar Singh', qualifications: 'BMS', displaySchedule: 'Time: 10:00 AM - 11:00 PM', specialization: 'General Physician', gender: 'male', consultationFee: 300 },
      { departmentId: getDeptId('General Consultation'), name: 'Ankit Kumar Singh', qualifications: 'MBBS', displaySchedule: 'Time: 10:00 AM - 7:30 PM', specialization: 'General Physician', gender: 'male', consultationFee: 400 },
      { departmentId: getDeptId('General Consultation'), name: 'Doctor 3', qualifications: 'MBBS', specialization: 'General Physician', gender: 'male', consultationFee: 400 },
      
      // ENT
      { departmentId: getDeptId('ENT'), name: 'Doctor 1', qualifications: 'MBBS', specialization: 'ENT Specialist', gender: 'male', consultationFee: 400 },
      
      // Orthopedics
      { departmentId: getDeptId('Orthopedics'), name: 'Doctor 1', qualifications: 'MBBS, MS Ortho', specialization: 'Orthopedist', gender: 'male', consultationFee: 500 },
      
      // General Surgery
      { departmentId: getDeptId('General Surgery'), name: 'Yogesh Pandey', qualifications: 'MS', specialization: 'General Surgeon', gender: 'male', consultationFee: 600 },
      
      // Pediatrics
      { departmentId: getDeptId('Pediatrics'), name: 'Doctor 1', qualifications: 'MD Pediatrics', specialization: 'Pediatrician', gender: 'female', consultationFee: 400 },
      
      // Urology
      { departmentId: getDeptId('Urology'), name: 'Vikram Singh', qualifications: 'MCH', specialization: 'Urologist', gender: 'male', consultationFee: 800 },
    ]
    const doctors = await Doctor.insertMany(doctorsData)

    logger.info('Seeding Services...')
    await Service.insertMany([
      { name: 'General Consultation', duration: 30, price: 500 },
      { name: 'Specialist Consultation', duration: 45, price: 800 },
    ])

    logger.info('Seeding TimeSlots for tomorrow...')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const slotsToInsert = []
    for (const doc of doctors) {
      const times = [
        { start: '10:00', end: '11:00' },
        { start: '11:00', end: '12:00' },
        { start: '12:00', end: '13:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' },
      ]
      
      for (const t of times) {
        slotsToInsert.push({
          doctorId: doc._id,
          date: tomorrow,
          startTime: t.start,
          endTime: t.end,
        })
      }
    }
    await TimeSlot.insertMany(slotsToInsert)

    logger.info('✅ Seed complete with KG Nanda Hospital Data!')
    process.exit(0)
  } catch (err) {
    logger.error('Seeding failed:', err)
    process.exit(1)
  }
}

seed()
