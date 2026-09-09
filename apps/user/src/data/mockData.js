/**
 * Mock Data for development.
 * 
 * This file provides realistic dummy data so the UI works
 * without a backend. When VITE_USE_MOCK=false, this file is never used.
 * 
 * Structure mirrors the expected API response shapes exactly,
 * making the switch to real data seamless.
 */

// ── Departments (mirror seed) ──
export const mockDepartments = [
  { id: 1, name: 'Gynecology & Obstetrics / स्त्री एवं प्रसूति रोग' },
  { id: 2, name: 'General Consultation / सामान्य परामर्श' },
  { id: 3, name: 'ENT / कान, नाक एवं गला' },
  { id: 4, name: 'Orthopedics / हड्डी एवं जोड़ रोग' },
  { id: 5, name: 'General Surgery / सामान्य शल्य चिकित्सा' },
  { id: 6, name: 'Pediatrics / बाल रोग' },
  { id: 7, name: 'Urology / मूत्र रोग विभाग' },
]

// ── Doctors ──
export const mockDoctors = [
  {
    id: 1,
    department_id: 1,
    name: 'Dr. Anand Prakash Tiwari',
    role: 'Senior Gynaecologist & Infertility Specialist',
    department: 'Obstetrics & Gynaecology',
    qualification: 'MBBS, M.S. (Obs & Gyane)',
    qualifications: 'MBBS, M.S. (Obs & Gyane)',
    experience: '15+ Years',
    image: '/Home/Dr. Anand Prakash.png',
    imageUrl: '/Home/Dr. Anand Prakash.png',
    ImageUrl: '/Home/Dr. Anand Prakash.png',
    specialty: 'High-Risk Pregnancy, Normal & Cesarean Delivery, Infertility Treatment, Laparoscopic Gynecological Surgery, PCOS & Menstrual Disorders, Antenatal & Postnatal Care',
    AOF: 'High-Risk Pregnancy, Normal & Cesarean Delivery, Infertility Treatment, Laparoscopic Gynecological Surgery, PCOS & Menstrual Disorders, Antenatal & Postnatal Care',
    specialization: 'Gynecologist',
    consultation_fee: 500,
    is_active: true,
    avatar: null,
    phone: '+91 98765 00001',
    email: 'anand@kgnanda.com',
    created_at: '2026-07-15T10:00:00Z',
  },
  { id: 2, department_id: 1, name: 'Dr. Vandana', role: 'Gynecologist', specialization: 'Gynecologist', consultation_fee: 300, is_active: true, avatar: null, phone: '+91 98765 00002', email: 'vandana@kgnanda.com', created_at: '2026-07-20T10:00:00Z' },
  { id: 3, department_id: 2, name: 'Dr. Abhishek Kumar Singh', role: 'General Physician', specialization: 'General Physician', consultation_fee: 300, is_active: true, avatar: null, phone: '+91 98765 00003', email: 'abhishek@kgnanda.com', created_at: '2026-08-01T10:00:00Z' },
  { id: 4, department_id: 5, name: 'Dr. Yogesh Pandey', role: 'General Surgeon', specialization: 'General Surgeon', consultation_fee: 600, is_active: true, avatar: null, phone: '+91 98765 00004', email: 'yogesh@kgnanda.com', created_at: '2026-08-10T10:00:00Z' },
  { id: 5, department_id: 7, name: 'Dr. Vikram Singh', role: 'Urologist', specialization: 'Urologist', consultation_fee: 800, is_active: true, avatar: null, phone: '+91 98765 00005', email: 'vikram@kgnanda.com', created_at: '2026-08-15T10:00:00Z' }
]

// ── Services ──
export const mockServices = [
  { id: 1, name: 'Gynecology Consultation', description: 'Expert consultation', is_active: true },
  { id: 2, name: 'General Consultation', description: 'Regular checkup', is_active: true },
  { id: 3, name: 'General Surgery', description: 'Surgical services', is_active: true },
  { id: 4, name: 'Urology', description: 'Urinary tract screening', is_active: true },
]

// ── Bookings ──
// Identity rules (mirror backend D2/D3): one UHID per phone (family shares it),
// every booking gets its own token (per doctor per day). created_by=null means
// WhatsApp bot; a staff code means registered by that staff member.
export const mockBookings = [
  {
    id: 1,
    booking_id: 'BK-20260820-001',
    doctor_id: 2,
    doctor_name: 'Dr. Abhishek Kumar Singh',
    service_id: 1,
    service_name: 'General Consultation',
    patient_name: 'Rahul Kumar',
    mobile: '9876543210',
    uhid: 'KGN-2026-00001',
    token_number: 'T-002',
    type: 'OPD',
    date: '2026-08-20',
    time_slot: '11:00 AM',
    status: 'confirmed',
    created_by: null,
    created_at: '2026-08-19T14:30:00Z',
    updated_at: '2026-08-19T15:00:00Z',
  },
  {
    id: 2,
    booking_id: 'BK-20260820-002',
    doctor_id: 1,
    doctor_name: 'Dr. Anand Prakash Tiwari',
    service_id: 1,
    service_name: 'General Consultation',
    patient_name: 'Neha Singh',
    mobile: '9876543211',
    uhid: 'KGN-2026-00002',
    token_number: 'T-001',
    type: 'OPD',
    date: '2026-08-20',
    time_slot: '10:00 AM',
    status: 'confirmed',
    created_by: null,
    created_at: '2026-08-19T16:00:00Z',
    updated_at: '2026-08-19T16:30:00Z',
  },
  {
    id: 3,
    booking_id: 'BK-20260820-003',
    doctor_id: 3,
    doctor_name: 'Dr. Yogesh Pandey',
    service_id: 3,
    service_name: 'Bone & Joint',
    patient_name: 'Amit Gupta',
    mobile: '9876543212',
    uhid: 'KGN-2026-00003',
    token_number: 'T-001',
    type: 'OPD',
    date: '2026-08-20',
    time_slot: '12:00 PM',
    status: 'pending',
    created_by: null,
    created_at: '2026-08-20T08:00:00Z',
    updated_at: '2026-08-20T08:00:00Z',
  },
  {
    id: 4,
    booking_id: 'BK-20260821-001',
    doctor_id: 2,
    doctor_name: 'Dr. Abhishek Kumar Singh',
    service_id: 2,
    service_name: 'Skin Treatment',
    patient_name: 'Pooja Yadav',
    mobile: '9876543213',
    uhid: 'KGN-2026-00004',
    token_number: 'T-001',
    type: 'OPD',
    date: '2026-08-21',
    time_slot: '05:00 PM',
    status: 'completed',
    created_by: null,
    created_at: '2026-08-20T09:00:00Z',
    updated_at: '2026-08-21T17:30:00Z',
  },
  {
    id: 5,
    booking_id: 'BK-20260822-001',
    doctor_id: 1,
    doctor_name: 'Dr. Anand Prakash Tiwari',
    service_id: 1,
    service_name: 'General Consultation',
    patient_name: 'Vikram Mehra',
    mobile: '9876543214',
    uhid: 'KGN-2026-00005',
    token_number: 'T-001',
    type: 'OPD',
    date: '2026-08-22',
    time_slot: '09:00 AM',
    status: 'cancelled',
    created_by: null,
    created_at: '2026-08-21T11:00:00Z',
    updated_at: '2026-08-22T08:00:00Z',
  },
  {
    id: 6,
    booking_id: 'BK-20260825-001',
    doctor_id: 3,
    doctor_name: 'Dr. Yogesh Pandey',
    service_id: 3,
    service_name: 'Bone & Joint',
    patient_name: 'Sneha Kapoor',
    mobile: '9876543215',
    uhid: 'KGN-2026-00006',
    token_number: 'T-001',
    type: 'OPD',
    date: '2026-08-25',
    time_slot: '02:00 PM',
    status: 'confirmed',
    created_by: null,
    created_at: '2026-08-24T10:00:00Z',
    updated_at: '2026-08-24T10:30:00Z',
  },
  {
    id: 7,
    booking_id: 'BK-20260826-001',
    doctor_id: 2,
    doctor_name: 'Dr. Abhishek Kumar Singh',
    service_id: 2,
    service_name: 'Skin Treatment',
    patient_name: 'Ravi Sharma',
    mobile: '9876543216',
    uhid: 'KGN-2026-00007',
    token_number: 'T-001',
    type: 'OPD',
    date: '2026-08-26',
    time_slot: '11:30 AM',
    status: 'pending',
    created_by: null,
    created_at: '2026-08-25T16:00:00Z',
    updated_at: '2026-08-25T16:00:00Z',
  },
  {
    id: 8,
    booking_id: 'BK-20260828-001',
    doctor_id: 1,
    doctor_name: 'Dr. Anand Prakash Tiwari',
    service_id: 1,
    service_name: 'General Consultation',
    patient_name: 'Priya Nair',
    mobile: '9876543217',
    uhid: 'KGN-2026-00008',
    token_number: 'T-001',
    type: 'OPD',
    date: '2026-08-28',
    time_slot: '04:00 PM',
    status: 'confirmed',
    created_by: 'KGN_RC_001',
    created_at: '2026-08-27T09:00:00Z',
    updated_at: '2026-08-27T09:30:00Z',
  },
  {
    id: 9,
    booking_id: 'BK-20260830-001',
    doctor_id: 3,
    doctor_name: 'Dr. Yogesh Pandey',
    service_id: 3,
    service_name: 'Bone & Joint',
    patient_name: 'Arjun Reddy',
    mobile: '9876543218',
    uhid: 'KGN-2026-00009',
    token_number: 'T-002',
    type: 'OPD',
    date: '2026-08-30',
    time_slot: '10:30 AM',
    status: 'completed',
    created_by: null,
    created_at: '2026-08-29T14:00:00Z',
    updated_at: '2026-08-30T11:00:00Z',
  },
  {
    id: 10,
    booking_id: 'BK-20260901-001',
    doctor_id: 2,
    doctor_name: 'Dr. Abhishek Kumar Singh',
    service_id: 2,
    service_name: 'Skin Treatment',
    patient_name: 'Kavita Joshi',
    mobile: '9876543219',
    uhid: 'KGN-2026-00010',
    token_number: 'T-001',
    type: 'OPD',
    date: '2026-09-01',
    time_slot: '03:00 PM',
    status: 'pending',
    created_by: null,
    created_at: '2026-08-31T12:00:00Z',
    updated_at: '2026-08-31T12:00:00Z',
  },
  {
    // Family follow-up: SAME phone + SAME UHID as booking 1, NEW token (D2/D3 demo)
    id: 11,
    booking_id: 'BK-20260902-001',
    doctor_id: 2,
    doctor_name: 'Dr. Abhishek Kumar Singh',
    service_id: 1,
    service_name: 'General Consultation',
    patient_name: 'Rahul Kumar',
    mobile: '9876543210',
    uhid: 'KGN-2026-00001',
    token_number: 'T-003',
    type: 'OPD',
    date: '2026-09-02',
    time_slot: '10:00 AM',
    status: 'confirmed',
    created_by: 'KGN_RC_001',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:30:00Z',
  },
  {
    // Hospitalization: booking ID only, no doctor, no token
    id: 12,
    booking_id: 'BK-20260902-002',
    doctor_id: null,
    doctor_name: '—',
    service_id: null,
    service_name: 'Hospitalization',
    patient_name: 'Ramesh Kumar',
    mobile: '9876543220',
    uhid: 'KGN-2026-00011',
    token_number: null,
    type: 'HOSPITALIZATION',
    date: '2026-09-03',
    time_slot: '—',
    status: 'pending',
    created_by: null,
    created_at: '2026-09-02T09:00:00Z',
    updated_at: '2026-09-02T09:00:00Z',
  },
]

// ── Time Slots ──
export const mockTimeSlots = [
  { id: 1, doctor_id: 1, time: '09:00 AM', is_booked: false },
  { id: 2, doctor_id: 1, time: '10:00 AM', is_booked: true },
  { id: 3, doctor_id: 1, time: '11:00 AM', is_booked: false },
  { id: 4, doctor_id: 1, time: '12:00 PM', is_booked: false },
  { id: 5, doctor_id: 1, time: '02:00 PM', is_booked: true },
  { id: 6, doctor_id: 1, time: '03:00 PM', is_booked: false },
  { id: 7, doctor_id: 1, time: '04:00 PM', is_booked: true },
  { id: 8, doctor_id: 1, time: '05:00 PM', is_booked: false },
  { id: 9, doctor_id: 2, time: '10:00 AM', is_booked: true },
  { id: 10, doctor_id: 2, time: '11:00 AM', is_booked: true },
  { id: 11, doctor_id: 2, time: '11:30 AM', is_booked: true },
  { id: 12, doctor_id: 2, time: '12:00 PM', is_booked: false },
  { id: 13, doctor_id: 2, time: '03:00 PM', is_booked: true },
  { id: 14, doctor_id: 2, time: '04:00 PM', is_booked: false },
  { id: 15, doctor_id: 2, time: '05:00 PM', is_booked: true },
  { id: 16, doctor_id: 3, time: '09:00 AM', is_booked: false },
  { id: 17, doctor_id: 3, time: '10:00 AM', is_booked: false },
  { id: 18, doctor_id: 3, time: '10:30 AM', is_booked: true },
  { id: 19, doctor_id: 3, time: '12:00 PM', is_booked: true },
  { id: 20, doctor_id: 3, time: '02:00 PM', is_booked: true },
  { id: 21, doctor_id: 3, time: '03:00 PM', is_booked: false },
  { id: 22, doctor_id: 3, time: '04:00 PM', is_booked: false },
]

// ── Dashboard Stats ──
export const mockDashboardStats = {
  totalBookings: 128,
  todayBookings: 24,
  confirmed: 98,
  cancelled: 10,
  totalRevenue: 86400,
  totalDoctors: 4,
  activeDoctors: 3,
  totalPatients: 95,
}

// ── Chart Data (Last 7 days) ──
export const mockChartData = [
  { date: 'Aug 26', bookings: 12, confirmed: 9, cancelled: 1 },
  { date: 'Aug 27', bookings: 18, confirmed: 15, cancelled: 2 },
  { date: 'Aug 28', bookings: 15, confirmed: 12, cancelled: 1 },
  { date: 'Aug 29', bookings: 22, confirmed: 18, cancelled: 3 },
  { date: 'Aug 30', bookings: 19, confirmed: 16, cancelled: 1 },
  { date: 'Aug 31', bookings: 25, confirmed: 20, cancelled: 2 },
  { date: 'Sep 01', bookings: 17, confirmed: 8, cancelled: 0 },
]

// ── Patients (derived from bookings) ──
export const mockPatients = [
  { id: 1, name: 'Rahul Kumar', mobile: '9876543210', is_old: true, total_bookings: 5, last_visit: '2026-08-20' },
  { id: 2, name: 'Neha Singh', mobile: '9876543211', is_old: false, total_bookings: 3, last_visit: '2026-08-20' },
  { id: 3, name: 'Amit Gupta', mobile: '9876543212', is_old: true, total_bookings: 2, last_visit: '2026-08-20' },
  { id: 4, name: 'Pooja Yadav', mobile: '9876543213', is_old: false, total_bookings: 4, last_visit: '2026-08-21' },
  { id: 5, name: 'Vikram Mehra', mobile: '9876543214', is_old: true, total_bookings: 1, last_visit: '2026-08-22' },
  { id: 6, name: 'Sneha Kapoor', mobile: '9876543215', is_old: true, total_bookings: 6, last_visit: '2026-08-25' },
  { id: 7, name: 'Ravi Sharma', mobile: '9876543216', is_old: false, total_bookings: 2, last_visit: '2026-08-26' },
  { id: 8, name: 'Priya Nair', mobile: '9876543217', is_old: true, total_bookings: 3, last_visit: '2026-08-28' },
  { id: 9, name: 'Arjun Reddy', mobile: '9876543218', is_old: false, total_bookings: 7, last_visit: '2026-08-30' },
  { id: 10, name: 'Kavita Joshi', mobile: '9876543219', is_old: true, total_bookings: 1, last_visit: '2026-09-01' },
]

// ── Mock Users (all roles, mock login) ──
// Demo passwords: super123 / admin123 / doctor123 / recep123 / pharm123
export const mockUsers = [
  { id: 1, name: 'Super Admin', email: 'super@kgnanda.com', role: 'superadmin', staffCode: 'KGN_SA_001', doctorId: null, phone: '9876543200', salary: 0, joiningDate: '2026-01-01', address: 'KG Nanda Hospital', activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], is_active: true },
  { id: 2, name: 'Hospital Admin', email: 'admin@docbot.com', role: 'admin', staffCode: 'KGN_ADM_001', doctorId: null, phone: '9876543201', salary: 60000, joiningDate: '2026-02-01', address: 'KG Nanda Hospital', activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], is_active: true },
  { id: 3, name: 'Dr. Anand Prakash Tiwari', email: 'doctor@kgnanda.com', role: 'doctor', staffCode: 'KGN_DOC_001', doctorId: 1, phone: '+91 98765 00001', salary: 80000, joiningDate: '2026-03-01', address: 'KG Nanda Hospital', activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], is_active: true },
  { id: 4, name: 'Front Desk', email: 'reception@kgnanda.com', role: 'receptionist', staffCode: 'KGN_RC_001', doctorId: null, phone: '9876543201', salary: 18000, joiningDate: '2026-04-01', address: 'Jaunpur', activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], is_active: true },
  { id: 5, name: 'Pharmacy Desk', email: 'pharmacy@kgnanda.com', role: 'pharmacy', staffCode: 'KGN_PHR_001', doctorId: null, phone: '9876543202', salary: 20000, joiningDate: '2026-04-15', address: 'Jaunpur', activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], is_active: true },
]

export const mockUserPasswords = {
  'super@kgnanda.com': 'super123',
  'admin@docbot.com': 'admin123',
  'doctor@kgnanda.com': 'doctor123',
  'reception@kgnanda.com': 'recep123',
  'pharmacy@kgnanda.com': 'pharm123',
}

// ── Mock User (Admin) — kept for backwards compat ──
export const mockUser = mockUsers[1]

// ── Medicine Orders (mock) ──
export const mockMedicineOrders = [
  {
    id: 1,
    order_id: 'MED-202608-001',
    patient_name: 'Rahul Kumar',
    mobile: '9876543210',
    address: 'Sector 12, Rohini, Delhi 110085',
    prescription_url: '/uploads/rx_demo1.jpg',
    customer_notes: 'Sugar medicine monthly',
    staff_notes: '',
    status: 'pending',
    created_by: null,
    created_at: '2026-08-28T10:00:00Z',
  },
  {
    id: 2,
    order_id: 'MED-202608-002',
    patient_name: 'Neha Singh',
    mobile: '9876543211',
    address: 'Civil Lines, Jaunpur 222001',
    prescription_url: '/uploads/rx_demo2.jpg',
    customer_notes: '',
    staff_notes: 'Called, confirmed generic substitute OK',
    status: 'processing',
    created_by: null,
    created_at: '2026-08-29T11:00:00Z',
  },
  {
    id: 3,
    order_id: 'MED-202609-001',
    patient_name: 'Amit Gupta',
    mobile: '9876543212',
    address: 'Station Road, Jaunpur 222001',
    prescription_url: '/uploads/rx_demo3.jpg',
    customer_notes: 'Urgent — fever',
    staff_notes: '',
    status: 'dispatched',
    created_by: 'KGN_RC_001',
    created_at: '2026-09-01T09:00:00Z',
  },
]

// ── Mock identity counters (UHID per phone + name combination) ──
// Seeded from the bookings above so mock registration continues the series.
export const mockIdentityState = {
  uhidByPhoneAndName: {
    '9876543210:rahul kumar': 'KGN-2026-00001',
    '9876543211:neha singh': 'KGN-2026-00002',
    '9876543212:amit gupta': 'KGN-2026-00003',
    '9876543213:pooja yadav': 'KGN-2026-00004',
    '9876543214:vikram mehra': 'KGN-2026-00005',
    '9876543215:sneha kapoor': 'KGN-2026-00006',
    '9876543216:ravi sharma': 'KGN-2026-00007',
    '9876543217:priya nair': 'KGN-2026-00008',
    '9876543218:arjun reddy': 'KGN-2026-00009',
    '9876543219:kavita joshi': 'KGN-2026-00010',
    '9876543220:ramesh kumar': 'KGN-2026-00011',
  },
  uhidByPhone: {
    '9876543210': 'KGN-2026-00001',
    '9876543211': 'KGN-2026-00002',
    '9876543212': 'KGN-2026-00003',
    '9876543213': 'KGN-2026-00004',
    '9876543214': 'KGN-2026-00005',
    '9876543215': 'KGN-2026-00006',
    '9876543216': 'KGN-2026-00007',
    '9876543217': 'KGN-2026-00008',
    '9876543218': 'KGN-2026-00009',
    '9876543219': 'KGN-2026-00010',
    '9876543220': 'KGN-2026-00011',
  },
  nextUhidSeq: 12,
  bookingSeqByDay: {},
  tokenSeqByDoctorDay: {},
  nextStaffSeqByRole: { superadmin: 2, admin: 2, doctor: 2, receptionist: 2, pharmacy: 2 },
}

export const STAFF_CODE_PREFIX = {
  superadmin: 'KGN_SA_',
  admin: 'KGN_ADM_',
  doctor: 'KGN_DOC_',
  receptionist: 'KGN_RC_',
  pharmacy: 'KGN_PHR_',
}

// ── Settings ──
export const mockSettings = {
  clinic_name: 'DocBot Clinic',
  clinic_address: '123 Health Street, Medical City',
  clinic_phone: '+91 98765 00000',
  whatsapp_number: '9161138859',
  whatsapp_api_status: 'connected',
  notification_booking_confirm: true,
  notification_booking_reminder: true,
  notification_booking_cancel: true,
  reminder_hours_before: 2,
}

// ── Doctor-wise Report ──
export const mockDoctorReport = [
  { doctor: 'Dr. Anand Prakash Tiwari', bookings: 42, revenue: 21000, completion_rate: 85 },
  { doctor: 'Dr. Abhishek Kumar Singh', bookings: 38, revenue: 30400, completion_rate: 92 },
  { doctor: 'Dr. Yogesh Pandey', bookings: 35, revenue: 35000, completion_rate: 78 },
  { doctor: 'Dr. Vikram Singh', bookings: 13, revenue: 15600, completion_rate: 88 },
]

// ── Status Distribution ──
export const mockStatusDistribution = [
  { name: 'Confirmed', value: 98, color: '#25D366' },
  { name: 'Pending', value: 15, color: '#f0ad4e' },
  { name: 'Completed', value: 5, color: '#58a6ff' },
  { name: 'Cancelled', value: 10, color: '#f85149' },
]
