/**
 * Booking Status Constants
 * Used across components for consistent status handling.
 */
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: 'Pending',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
}

export const STATUS_COLORS = {
  [BOOKING_STATUS.PENDING]: { text: '#f0ad4e', bg: 'rgba(240, 173, 78, 0.12)' },
  [BOOKING_STATUS.CONFIRMED]: { text: '#25D366', bg: 'rgba(37, 211, 102, 0.12)' },
  [BOOKING_STATUS.COMPLETED]: { text: '#58a6ff', bg: 'rgba(88, 166, 255, 0.12)' },
  [BOOKING_STATUS.CANCELLED]: { text: '#f85149', bg: 'rgba(248, 81, 73, 0.12)' },
}

/**
 * Sidebar navigation items.
 * Icons are Lucide icon names — resolved in Sidebar component.
 */
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/bookings', label: 'Bookings', icon: 'CalendarCheck' },
  { path: '/doctors', label: 'Doctors', icon: 'Stethoscope' },
  { path: '/time-slots', label: 'Time Slots', icon: 'Clock' },
  { path: '/patients', label: 'Patients', icon: 'Users' },
  { path: '/reports', label: 'Reports', icon: 'BarChart3' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
]

/**
 * Specializations — used in doctor forms
 */
export const SPECIALIZATIONS = [
  'General Physician',
  'Dermatologist',
  'Orthopedic',
  'Cardiologist',
  'Pediatrician',
  'ENT Specialist',
  'Dentist',
  'Neurologist',
  'Gynecologist',
  'Ophthalmologist',
]

/**
 * Default time slots
 */
export const DEFAULT_TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
]
