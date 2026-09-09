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

    logger.info('Seeding Official KG Nanda Hospital Departments...')
    const deptsData = [
      { name: 'Obstetrics & Gynaecology' },
      { name: 'Laparoscopic & General Surgery' },
      { name: 'Orthopaedics' },
      { name: 'Urology' },
      { name: 'Anaesthetist' },
      { name: 'General Surgery (Shalya)' },
      { name: 'Paediatric' },
      { name: 'ENT' },
      { name: 'RMO - Resident Medical Officer' },
      { name: 'General Medicine' },
      { name: 'General Consultant' },
      { name: 'Critical Care' },
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

    logger.info('Seeding All 17+ Official KG Nanda Hospital Doctors from image roster...')
    const doctorsData = [
      {
        departmentId: getDeptId('Laparoscopic'),
        department: getDeptName('Laparoscopic'),
        name: 'Abhinav Katiyar',
        role: 'Laparoscopic Surgeon',
        qualification: 'MBBS, DNB',
        specialization: 'Laparoscopic & General Surgery',
        specialty: 'Laparoscopic Surgery, Cholecystectomy, Hernia Repair, Minimally Invasive Surgery',
        experience: '12+ Years',
        image: '',
        gender: 'male',
        consultationFee: 500,
        maxPatientsPerDay: 30,
        isActive: true,
      },
      {
        departmentId: getDeptId('Obstetrics'),
        department: getDeptName('Obstetrics'),
        name: 'Anand Prakash Tiwari',
        role: 'Senior Gynaecologist & Infertility Specialist',
        qualification: 'M.S. (Obs & Gynae)',
        specialization: 'Obstetrics & Gynaecology',
        specialty: 'High-Risk Pregnancy, Normal & Cesarean Delivery, Infertility Treatment, Laparoscopic Gynecological Surgery',
        experience: '15+ Years',
        image: '',
        gender: 'male',
        consultationFee: 500,
        maxPatientsPerDay: 40,
        isActive: true,
      },
      {
        departmentId: getDeptId('Urology'),
        department: getDeptName('Urology'),
        name: 'Vikram Singh',
        role: 'Urologist',
        qualification: 'MBBS, MCH',
        specialization: 'Urology',
        specialty: 'Kidney Stone Surgery, Endourology, Prostate Care, Urological Consultation',
        experience: '14+ Years',
        image: '',
        gender: 'male',
        consultationFee: 600,
        maxPatientsPerDay: 25,
        isActive: true,
      },
      {
        departmentId: getDeptId('Orthopaedics'),
        department: getDeptName('Orthopaedics'),
        name: 'Arun Kumar Singh',
        role: 'Orthopedic Surgeon',
        qualification: 'MBBS',
        specialization: 'Orthopaedics',
        specialty: 'Fracture Management, Trauma Surgery, Joint Pain Care, Bone Health',
        experience: '10+ Years',
        image: '',
        gender: 'male',
        consultationFee: 400,
        maxPatientsPerDay: 30,
        isActive: true,
      },
      {
        departmentId: getDeptId('Laparoscopic'),
        department: getDeptName('Laparoscopic'),
        name: 'Vishwanath Pratap Singh',
        role: 'Laparoscopic Surgeon',
        qualification: 'MBBS, MS',
        specialization: 'Laparoscopic & General Surgery',
        specialty: 'General Surgery, Laparoscopic Procedures, Abdominal Surgery',
        experience: '11+ Years',
        image: '',
        gender: 'male',
        consultationFee: 500,
        maxPatientsPerDay: 30,
        isActive: true,
      },
      {
        departmentId: getDeptId('Orthopaedics'),
        department: getDeptName('Orthopaedics'),
        name: 'Pankaj Kumar Singh',
        role: 'Orthopedic Specialist',
        qualification: 'MBBS, MS',
        specialization: 'Orthopaedics',
        specialty: 'Orthopedic Surgery, Joint Replacement, Trauma & Fracture Care',
        experience: '13+ Years',
        image: '',
        gender: 'male',
        consultationFee: 500,
        maxPatientsPerDay: 30,
        isActive: true,
      },
      {
        departmentId: getDeptId('Anaesthetist'),
        department: getDeptName('Anaesthetist'),
        name: 'Sushil Krishna Murti',
        role: 'Anesthesiologist',
        qualification: 'MBBS, MD',
        specialization: 'Anaesthetist',
        specialty: 'Critical Care Anesthesia, Surgical Anesthesiology, Pain Management',
        experience: '16+ Years',
        image: '',
        gender: 'male',
        consultationFee: 500,
        maxPatientsPerDay: 20,
        isActive: true,
      },
      {
        departmentId: getDeptId('General Surgery (Shalya)'),
        department: getDeptName('General Surgery (Shalya)'),
        name: 'Mrityunjay Prasad',
        role: 'General & Ayurvedic Surgeon',
        qualification: 'MS (Shalya)',
        specialization: 'General Surgery (Shalya)',
        specialty: 'Shalya Chikitsa, General Surgical Procedures, Ayurvedic Surgery',
        experience: '12+ Years',
        image: '',
        gender: 'male',
        consultationFee: 400,
        maxPatientsPerDay: 25,
        isActive: true,
      },
      {
        departmentId: getDeptId('RMO'),
        department: getDeptName('RMO'),
        name: 'Ankit Kumar Singh',
        role: 'Resident Medical Officer',
        qualification: 'MBBS',
        specialization: 'General Medicine & RMO',
        specialty: 'Emergency Care, General Consultation, Inpatient Management',
        experience: '6+ Years',
        image: '',
        gender: 'male',
        consultationFee: 300,
        maxPatientsPerDay: 40,
        isActive: true,
      },
      {
        departmentId: getDeptId('Paediatric'),
        department: getDeptName('Paediatric'),
        name: 'Prabhunath Dubey',
        role: 'Pediatric Specialist',
        qualification: 'BMS, PGDNC',
        specialization: 'Paediatric',
        specialty: 'Neonatal & Child Care, Pediatric Nutrition, Child Immunization',
        experience: '10+ Years',
        image: '',
        gender: 'male',
        consultationFee: 350,
        maxPatientsPerDay: 30,
        isActive: true,
      },
      {
        departmentId: getDeptId('ENT'),
        department: getDeptName('ENT'),
        name: 'Abhinav Mishra',
        role: 'ENT Specialist',
        qualification: 'MBBS, MS (ENT)',
        specialization: 'ENT',
        specialty: 'Ear, Nose & Throat Disorders, Sinus Care, Tonsillectomy',
        experience: '9+ Years',
        image: '',
        gender: 'male',
        consultationFee: 400,
        maxPatientsPerDay: 25,
        isActive: true,
      },
      {
        departmentId: getDeptId('General Surgery (Shalya)'),
        department: getDeptName('General Surgery (Shalya)'),
        name: 'Yogesh Kumar Pandey',
        role: 'General & Ayurvedic Surgeon',
        qualification: 'MS (Shalya)',
        specialization: 'General Surgery (Shalya)',
        specialty: 'General Surgery, Shalya Chikitsa, Anorectal Care',
        experience: '11+ Years',
        image: '',
        gender: 'male',
        consultationFee: 400,
        maxPatientsPerDay: 25,
        isActive: true,
      },
      {
        departmentId: getDeptId('RMO'),
        department: getDeptName('RMO'),
        name: 'Akhilesh Kumar Singh',
        role: 'Resident Medical Officer',
        qualification: 'BAMS (RMO)',
        specialization: 'Resident Medical Officer',
        specialty: 'General Healthcare, Inpatient Monitoring, Immediate Medical Care',
        experience: '7+ Years',
        image: '',
        gender: 'male',
        consultationFee: 300,
        maxPatientsPerDay: 35,
        isActive: true,
      },
      {
        departmentId: getDeptId('Orthopaedics'),
        department: getDeptName('Orthopaedics'),
        name: 'Niket Raj Garg',
        role: 'Orthopedic Surgeon',
        qualification: 'MBBS, MS',
        specialization: 'Orthopaedics',
        specialty: 'Spine & Joint Care, Orthopedic Trauma, Arthroscopy',
        experience: '10+ Years',
        image: '',
        gender: 'male',
        consultationFee: 450,
        maxPatientsPerDay: 25,
        isActive: true,
      },
      {
        departmentId: getDeptId('Paediatric'),
        department: getDeptName('Paediatric'),
        name: 'Dilip Kumar Gupta',
        role: 'Senior Pediatrician',
        qualification: 'MBBS, DCH',
        specialization: 'Paediatric',
        specialty: 'Child Health, Newborn Care, Pediatric Infections & Growth',
        experience: '14+ Years',
        image: '',
        gender: 'male',
        consultationFee: 400,
        maxPatientsPerDay: 35,
        isActive: true,
      },
      {
        departmentId: getDeptId('RMO'),
        department: getDeptName('RMO'),
        name: 'Parvez Ahmad',
        role: 'Resident Medical Officer',
        qualification: 'BAMS, MD',
        specialization: 'General Medicine & RMO',
        specialty: 'Primary Care, Outpatient Consultation, General Health',
        experience: '8+ Years',
        image: '',
        gender: 'male',
        consultationFee: 300,
        maxPatientsPerDay: 35,
        isActive: true,
      },
      {
        departmentId: getDeptId('RMO'),
        department: getDeptName('RMO'),
        name: 'Umesh Kumar Maurya',
        role: 'Resident Medical Officer',
        qualification: 'MBBS',
        specialization: 'Critical Care & RMO',
        specialty: 'Emergency Medicine, ICU Care, Patient Triage',
        experience: '9+ Years',
        image: '',
        gender: 'male',
        consultationFee: 350,
        maxPatientsPerDay: 35,
        isActive: true,
      },
      {
        departmentId: getDeptId('Obstetrics'),
        department: getDeptName('Obstetrics'),
        name: 'Shobha Jaiswal',
        role: 'Gynecologist & Obstetrician',
        qualification: 'MBBS, MS (Obs & Gynae)',
        specialization: 'Obstetrics & Gynaecology',
        specialty: 'Pregnancy Care, Normal Delivery, Women\'s Health',
        experience: '12+ Years',
        image: '',
        gender: 'female',
        consultationFee: 400,
        maxPatientsPerDay: 25,
        isActive: true,
      },
      {
        departmentId: getDeptId('Obstetrics'),
        department: getDeptName('Obstetrics'),
        name: 'Sadhna Chaurasiya',
        role: 'Gynecologist & Obstetrician',
        qualification: 'MBBS, DGO',
        specialization: 'Obstetrics & Gynaecology',
        specialty: 'Antenatal Care, Family Planning, Routine Gynecology',
        experience: '9+ Years',
        image: '',
        gender: 'female',
        consultationFee: 350,
        maxPatientsPerDay: 25,
        isActive: true,
      },
    ]
    const doctors = await Doctor.insertMany(doctorsData)

    logger.info('Seeding Doctor login (linked to Anand Prakash Tiwari)...')
    const anandDoc = doctors.find((d) => d.name.includes('Anand Prakash')) || doctors[0]
    await User.create({
      name: anandDoc.name,
      email: 'doctor@kgnanda.com',
      passwordHash: await bcrypt.hash('doctor123', 10),
      role: 'doctor',
      doctorId: anandDoc._id,
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

    logger.info('Seeding Patients (with isOld status and lastVisited tracking)...')
    const patientsData = [
      { phone: '919876543210', uhid: 'KGN-2026-00001', name: 'Rahul Kumar', age: 34, gender: 'male', district: 'Jaunpur', address: 'Civil Lines', isOld: true, lastVisited: new Date('2026-08-20') },
      { phone: '919876543211', uhid: 'KGN-2026-00002', name: 'Neha Singh', age: 28, gender: 'female', district: 'Jaunpur', address: 'Line Bazar', isOld: false, lastVisited: new Date('2026-08-20') },
      { phone: '919876543212', uhid: 'KGN-2026-00003', name: 'Amit Gupta', age: 45, gender: 'male', district: 'Varanasi', address: 'Cantt', isOld: true, lastVisited: new Date('2026-08-20') },
      { phone: '919876543213', uhid: 'KGN-2026-00004', name: 'Pooja Yadav', age: 31, gender: 'female', district: 'Jaunpur', address: 'Husainabad', isOld: false, lastVisited: new Date('2026-08-21') },
      { phone: '919876543214', uhid: 'KGN-2026-00005', name: 'Vikram Mehra', age: 52, gender: 'male', district: 'Lucknow', address: 'Gomti Nagar', isOld: true, lastVisited: new Date('2026-08-22') },
      { phone: '919876543215', uhid: 'KGN-2026-00006', name: 'Sneha Kapoor', age: 26, gender: 'female', district: 'Jaunpur', address: 'Sadar', isOld: true, lastVisited: new Date('2026-08-25') },
      { phone: '919876543216', uhid: 'KGN-2026-00007', name: 'Ravi Sharma', age: 39, gender: 'male', district: 'Jaunpur', address: 'Mariahu', isOld: false, lastVisited: new Date('2026-08-26') },
      { phone: '919876543217', uhid: 'KGN-2026-00008', name: 'Priya Nair', age: 30, gender: 'female', district: 'Varanasi', address: 'Lanka', isOld: true, lastVisited: new Date('2026-08-28') },
      { phone: '919876543218', uhid: 'KGN-2026-00009', name: 'Arjun Reddy', age: 41, gender: 'male', district: 'Jaunpur', address: 'Shahganj', isOld: false, lastVisited: new Date('2026-08-30') },
      { phone: '919876543219', uhid: 'KGN-2026-00010', name: 'Kavita Joshi', age: 36, gender: 'female', district: 'Jaunpur', address: 'Zafarabad', isOld: true, lastVisited: new Date('2026-09-01') },
    ]
    const patients = await Patient.insertMany(patientsData)

    logger.info('Seeding Sample Bookings...')
    await Booking.create({
      bookingId: 'BK-20260820-001',
      tokenNumber: 'T-001',
      doctorId: doctors[0]._id,
      patientId: patients[0]._id,
      departmentId: doctors[0].departmentId,
      preferredDate: new Date('2026-08-20'),
      problemDescription: 'Routine Checkup & Fever',
      type: 'OPD',
      status: 'completed',
      bookingSource: 'whatsapp',
    })

    logger.info('Seeding Sample Medicine Orders...')
    await MedicineOrder.create({
      orderId: 'MO-20260820-001',
      patientId: patients[0]._id,
      deliveryAddress: 'Civil Lines, Jaunpur, UP 222001',
      prescriptionUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
      customerNotes: 'Deliver by evening please',
      status: 'processing',
      source: 'whatsapp',
    })

    logger.info(`✅ Seed complete with all ${doctors.length} KG Nanda Hospital Doctors & Departments!`)
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
