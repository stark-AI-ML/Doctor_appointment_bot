import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import env from './config/env.js'
import logger from './utils/logger.js'

import User from './modules/user/user.model.js'
import Doctor from './modules/doctor/doctor.model.js'
import Service from './modules/service/service.model.js'
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
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Service.deleteMany({}),
      Department.deleteMany({}),
      Booking.deleteMany({}),
      Patient.deleteMany({}),
      MedicineOrder.deleteMany({}),
    ])

    logger.info('Seeding Users (all roles, matching frontend demo logins)...')
    await User.create({
      name: 'Super Admin',
      email: 'super@kgnanda.com',
      passwordHash: await bcrypt.hash('super123', 10),
      role: 'superadmin',
      staffCode: 'KGN_SA_001',
      phone: '9876543200',
      salary: 0,
      joiningDate: new Date('2026-01-01'),
      address: 'KG Nanda Hospital',
      isActive: true,
    })

    // Demo logins for the dashboard
    const demoUsers = [
      { name: 'Hospital Admin', email: 'admin@docbot.com', role: 'admin', staffCode: 'KGN_ADM_001', phone: '9876543201', salary: 60000, joiningDate: new Date('2026-02-01'), address: 'KG Nanda Hospital', password: 'admin123' },
      { name: 'Front Desk', email: 'reception@kgnanda.com', role: 'receptionist', staffCode: 'KGN_RC_001', phone: '9876543201', salary: 18000, joiningDate: new Date('2026-04-01'), address: 'Jaunpur', password: 'recep123' },
      { name: 'Pharmacy Desk', email: 'pharmacy@kgnanda.com', role: 'pharmacy', staffCode: 'KGN_PHR_001', phone: '9876543202', salary: 20000, joiningDate: new Date('2026-04-15'), address: 'Jaunpur', password: 'pharm123' },
    ]
    for (const u of demoUsers) {
      await User.create({
        name: u.name,
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 10),
        role: u.role,
        staffCode: u.staffCode,
        phone: u.phone,
        salary: u.salary,
        joiningDate: u.joiningDate,
        address: u.address,
        isActive: true,
      })
    }

    logger.info('Seeding Departments...')
    const deptsData = [
      { name: 'Obstetrics & Gynaecology' },
      { name: 'Gynecologist & Obstetrician' },
      { name: 'General Medicine' },
      { name: 'General Consultant' },
      { name: 'Neurology' },
      { name: 'Cardiology' },
      { name: 'Pediatrics' },
      { name: 'Oncology' },
      { name: 'General & Laparoscopy Surgery' },
      { name: 'General Surgery' },
      { name: 'Urology' },
      { name: 'Anesthesia' },
    ]
    const depts = await Department.insertMany(deptsData)

    const getDeptId = (namePart) => {
      const found = depts.find((d) => d.name.toLowerCase().includes(namePart.toLowerCase()))
      return found ? found._id : depts[0]._id
    }

    const getDeptName = (namePart) => {
      const found = depts.find((d) => d.name.toLowerCase().includes(namePart.toLowerCase()))
      return found ? found.name : namePart
    }

    logger.info('Seeding Doctors (canonical fields only — no duplicates)...')
    const doctorsData = [
      {
        departmentId: getDeptId('Obstetrics'),
        department: getDeptName('Obstetrics'),
        name: 'Dr. Anand Prakash Tiwari',
        role: 'Senior Gynaecologist & Infertility Specialist',
        qualification: 'MBBS, M.S. (Obs & Gyane)',
        specialization: 'Obstetrics & Gynaecology',
        specialty: 'High-Risk Pregnancy, Normal & Cesarean Delivery, Infertility Treatment, Laparoscopic Gynecological Surgery, PCOS & Menstrual Disorders, Antenatal & Postnatal Care',
        experience: '15+ Years',
        image: '/Home/Dr. Anand Prakash.png',
        gender: 'male',
        consultationFee: 500,
        maxPatientsPerDay: 40,
        isActive: true,
      },
      {
        departmentId: getDeptId('Gynecologist'),
        department: getDeptName('Gynecologist'),
        name: 'Dr. Neepu Chaurasia',
        role: 'Obstetrics & Gynaecology',
        qualification: 'MBBS, Diploma in Gynecology & Obstetrics (D.G.O.)',
        specialization: 'Gynecologist & Obstetrician',
        specialty: 'Pregnancy Care, Normal Delivery, Women\'s Health, Menstrual Disorders, Family Planning, High-Risk Pregnancy',
        experience: '10+ Years',
        image: 'https://i.pinimg.com/1200x/72/41/a3/7241a3fe9d1687bd6c2a8ce55ca348ce.jpg',
        gender: 'female',
        consultationFee: 400,
        maxPatientsPerDay: 30,
        isActive: true,
      },
      {
        departmentId: getDeptId('Gynecologist'),
        department: getDeptName('Gynecologist'),
        name: 'Dr. Nidhi Gupta',
        role: 'Gynecologist & Obstetrician',
        qualification: 'MBBS, R.M.O.',
        specialization: 'Gynecologist & Obstetrician',
        specialty: 'Women\'s Health, Pregnancy Care, Gynecological Consultation, Antenatal Care, Postnatal Care, Routine Gynecology',
        experience: '8+ Years',
        image: 'https://i.pinimg.com/1200x/72/41/a3/7241a3fe9d1687bd6c2a8ce55ca348ce.jpg',
        gender: 'female',
        consultationFee: 350,
        maxPatientsPerDay: 25,
        isActive: true,
      },
      {
        departmentId: getDeptId('Gynecologist'),
        department: getDeptName('Gynecologist'),
        name: 'Dr. Priyanka Mishra',
        role: 'Obstetrics & Gynaecology',
        qualification: 'MBBS, R.M.O.',
        specialization: 'Gynecologist & Obstetrician',
        specialty: 'Pregnancy Care, Women\'s Wellness, Gynecological Disorders, Family Planning, Antenatal Care, General Gynecology',
        experience: '7+ Years',
        image: 'https://i.pinimg.com/1200x/72/41/a3/7241a3fe9d1687bd6c2a8ce55ca348ce.jpg',
        gender: 'female',
        consultationFee: 350,
        maxPatientsPerDay: 25,
        isActive: true,
      },
      {
        departmentId: getDeptId('Gynecologist'),
        department: getDeptName('Gynecologist'),
        name: 'Dr. Nisha Singh',
        role: 'Obstetrics & Gynaecology',
        qualification: 'MBBS, R.M.O.',
        specialization: 'Gynecologist & Obstetrician',
        specialty: 'Women\'s Health, Pregnancy Management, Routine Gynecological Care, Antenatal & Postnatal Care, PCOD Management, General Obstetrics',
        experience: '7+ Years',
        image: 'https://i.pinimg.com/1200x/72/41/a3/7241a3fe9d1687bd6c2a8ce55ca348ce.jpg',
        gender: 'female',
        consultationFee: 350,
        maxPatientsPerDay: 25,
        isActive: true,
      },
      {
        departmentId: getDeptId('Neurology'),
        department: getDeptName('Neurology'),
        name: 'Dr. Robert Vance',
        role: 'Chief Neurosurgeon',
        qualification: 'MBBS, MS, MCh (Neurosurgery)',
        specialization: 'Neurology',
        specialty: 'Brain Tumors, Spinal Disorders, Neurotrauma Surgery',
        experience: '18+ Years',
        image: 'https://i.pinimg.com/1200x/72/41/a3/7241a3fe9d1687bd6c2a8ce55ca348ce.jpg',
        gender: 'male',
        consultationFee: 1000,
        maxPatientsPerDay: 15,
        isActive: true,
      },
      {
        departmentId: getDeptId('Cardiology'),
        department: getDeptName('Cardiology'),
        name: 'Dr. Alisha Khan',
        role: 'Cardiology Head',
        qualification: 'MBBS, MD (Medicine), DM (Cardiology)',
        specialization: 'Cardiology',
        specialty: 'Interventional Cardiology, Heart Failure Management, Angioplasty',
        experience: '15+ Years',
        image: 'https://i.pinimg.com/1200x/72/41/a3/7241a3fe9d1687bd6c2a8ce55ca348ce.jpg',
        gender: 'female',
        consultationFee: 800,
        maxPatientsPerDay: 20,
        isActive: true,
      },
      {
        departmentId: getDeptId('Pediatrics'),
        department: getDeptName('Pediatrics'),
        name: 'Dr. Sameer Joshi',
        role: 'Senior Pediatrician',
        qualification: 'MBBS, MD (Pediatrics), DCH',
        specialization: 'Pediatrics',
        specialty: 'Neonatal Care, Pediatric Nutrition, Infectious Diseases',
        experience: '16+ Years',
        image: 'https://i.pinimg.com/1200x/72/41/a3/7241a3fe9d1687bd6c2a8ce55ca348ce.jpg',
        gender: 'male',
        consultationFee: 500,
        maxPatientsPerDay: 35,
        isActive: true,
      },
      {
        departmentId: getDeptId('Oncology'),
        department: getDeptName('Oncology'),
        name: 'Dr. Elena Rostova',
        role: 'Oncology Expert',
        qualification: 'MBBS, MD, DM (Medical Oncology)',
        specialization: 'Oncology',
        specialty: 'Chemotherapy, Immunotherapy, Targeted Cancer Therapies',
        experience: '14+ Years',
        image: 'https://i.pinimg.com/1200x/72/41/a3/7241a3fe9d1687bd6c2a8ce55ca348ce.jpg',
        gender: 'female',
        consultationFee: 900,
        maxPatientsPerDay: 15,
        isActive: true,
      },
      {
        departmentId: getDeptId('Obstetrics'),
        department: getDeptName('Obstetrics'),
        name: 'Dr. Priya Sharma',
        role: 'Gynaecology Specialist',
        qualification: 'MBBS, MS (OBGYN), FMAS',
        specialization: 'Obstetrics & Gynaecology',
        specialty: 'High-risk Pregnancy, Laparoscopic Gynaecology, Infertility Care',
        experience: '12+ Years',
        image: 'https://i.pinimg.com/1200x/72/41/a3/7241a3fe9d1687bd6c2a8ce55ca348ce.jpg',
        gender: 'female',
        consultationFee: 500,
        maxPatientsPerDay: 30,
        isActive: true,
      },
    ]
    const doctors = await Doctor.insertMany(doctorsData)

    logger.info('Seeding Doctor login (linked to first doctor)...')
    await User.create({
      name: doctors[0].name,
      email: 'doctor@kgnanda.com',
      passwordHash: await bcrypt.hash('doctor123', 10),
      role: 'doctor',
      doctorId: doctors[0]._id,
      staffCode: 'KGN_DOC_001',
      phone: '+91 98765 00001',
      salary: 80000,
      joiningDate: new Date('2026-03-01'),
      address: 'KG Nanda Hospital',
      isActive: true,
    })

    logger.info('Seeding Services...')
    await Service.insertMany([
      { name: 'General Consultation', duration: 30, price: 500 },
      { name: 'Specialist Consultation', duration: 45, price: 800 },
    ])

    // TimeSlots removed — using maxPatientsPerDay on Doctor model instead

    logger.info('✅ Seed complete with KG Nanda Hospital Data!')
    console.log('\n--- 🔑 Seeded Login Credentials ---')
    console.log('Super Admin : super@kgnanda.com    / super123')
    console.log('Admin       : admin@docbot.com     / admin123')
    console.log('Doctor      : doctor@kgnanda.com    / doctor123')
    console.log('Reception   : reception@kgnanda.com / recep123')
    console.log('Pharmacy    : pharmacy@kgnanda.com  / pharm123')
    console.log('-----------------------------------\n')
    process.exit(0)
  } catch (err) {
    logger.error('Seeding failed:', err)
    process.exit(1)
  }
}

seed()
