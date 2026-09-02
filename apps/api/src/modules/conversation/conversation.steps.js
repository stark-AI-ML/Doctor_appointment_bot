/**
 * Conversation step definitions and message templates.
 */

export const STEPS = {
  WELCOME:        'WELCOME',
  SELECT_DOCTOR:  'SELECT_DOCTOR',
  SELECT_DATE:    'SELECT_DATE',
  SELECT_SLOT:    'SELECT_SLOT',
  ENTER_NAME:     'ENTER_NAME',
  ENTER_AGE:      'ENTER_AGE',
  ENTER_GENDER:   'ENTER_GENDER',
  CONFIRM:        'CONFIRM',
  DONE:           'DONE',
  MY_BOOKINGS:    'MY_BOOKINGS',
  CANCEL_SELECT:  'CANCEL_SELECT',
}

export const MESSAGES = {
  welcome: () =>
    `👋 Namaste! Welcome to our Booking Service.\nAap kya karna chahte hain?\n\n1. Appointment Book\n2. My Booking\n3. Cancel / Reschedule\n4. Talk to Support`,

  selectDoctor: (doctors) => {
    const list = doctors.map((d, i) => `${i + 1}. ${d.name} — ${d.specialization}`).join('\n')
    return `Please Doctor select karein:\n\n${list}`
  },

  selectDate: () =>
    `Date select karein:\n\n1. Today\n2. Tomorrow\n3. Other Date (DD/MM/YYYY bhejein)`,

  selectSlot: (slots, dateStr) => {
    const list = slots.map((s, i) => `${i + 1}. ${formatTime(s.startTime)} - ${formatTime(s.endTime)}`).join('\n')
    return `Available Slots (${dateStr}):\n\n${list}`
  },

  noSlots: (dateStr) =>
    `Sorry, ${dateStr} ke liye koi slot available nahi hai.\nKripya doosri date try karein.\n\n1. Today\n2. Tomorrow\n3. Other Date (DD/MM/YYYY bhejein)`,

  enterName: () =>
    `Please apna naam bhejiye:`,

  enterAge: (name) =>
    `Dhanyavaad ${name}! 🙏\nPlease apni age bhejiye:`,

  enterGender: () =>
    `Gender select karein:\n\n1. Male\n2. Female\n3. Other`,

  confirm: ({ doctorName, date, time }) =>
    `📋 Booking Details:\n\nDoctor: ${doctorName}\nDate: ${date}\nTime: ${time}\n\nConfirm karein?\n1. Confirm\n2. Change`,

  done: ({ bookingId, doctorName, date, time }) =>
    `✅ Appointment Confirmed!\n\nBooking ID: ${bookingId}\nDoctor: ${doctorName}\nDate: ${date}\nTime: ${time}\n\nThank you! We look forward to seeing you. 😊`,

  myBookings: (bookings) => {
    if (!bookings.length) return `Aapki koi booking nahi hai.\n\nKya aap appointment book karna chahenge?\n1. Haan\n2. Nahi`

    const list = bookings.map((b, i) => {
      const slot = b.slotId
      const date = slot?.date ? new Date(slot.date).toLocaleDateString('en-IN') : 'N/A'
      const time = slot ? `${formatTime(slot.startTime)}` : 'N/A'
      return `${i + 1}. ${b.bookingId}\n   Doctor: ${b.doctorId?.name || 'N/A'}\n   Date: ${date} | Time: ${time}\n   Status: ${b.status}`
    }).join('\n\n')

    return `📋 Aapki Bookings:\n\n${list}`
  },

  cancelSelect: (bookings) => {
    const list = bookings.map((b, i) =>
      `${i + 1}. ${b.bookingId} — ${b.doctorId?.name || 'N/A'}`
    ).join('\n')
    return `Kaunsi booking cancel karni hai?\n\n${list}\n\n0. Back to menu`
  },

  cancelled: (bookingId) =>
    `❌ Booking ${bookingId} cancel ho gayi hai.\nSlot free kar diya gaya hai.`,

  support: () =>
    `📞 Support ke liye contact karein:\nPhone: 9161138859\nTiming: Mon-Sat, 10am-5pm\n\nYa hum aapko callback karenge.`,

  invalidInput: () =>
    `Maaf karein, samajh nahi aaya. Kripya sahi option choose karein.`,
}

/**
 * Format 24hr time string to 12hr format.
 * "14:00" → "02:00 PM"
 */
function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}
