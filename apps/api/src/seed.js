import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import env from './config/env.js'
import logger from './utils/logger.js'

import Admin from './modules/admin/admin.model.js'
import Doctor from './modules/doctor/doctor.model.js'
import Service from './modules/service/service.model.js'
import TimeSlot from './modules/booking/timeslot.model.js'

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
    ])

    logger.info('Seeding Admin...')
    const passwordHash = await bcrypt.hash('admin123', 10)
    await Admin.create({
      name: 'Super Admin',
      email: 'admin@docbot.com',
      passwordHash,
      role: 'superadmin',
    })

    logger.info('Seeding Doctors...')
    const doctors = await Doctor.insertMany([
      { name: 'Dr. Sharma', specialization: 'General Physician', experience: 10, consultationFee: 500, gender: 'male' },
      { name: 'Dr. Verma', specialization: 'Cardiologist', experience: 15, consultationFee: 1000, gender: 'male' },
      { name: 'Dr. Gupta', specialization: 'Dermatologist', experience: 8, consultationFee: 800, gender: 'female' },
    ])

    logger.info('Seeding Services...')
    await Service.insertMany([
      { name: 'General Consultation', duration: 30, price: 500 },
      { name: 'Cardiac Checkup', duration: 45, price: 1500 },
      { name: 'Skin Therapy', duration: 60, price: 2000 },
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

    logger.info('✅ Seed complete!')
    process.exit(0)
  } catch (err) {
    logger.error('Seeding failed:', err)
    process.exit(1)
  }
}

seed()
