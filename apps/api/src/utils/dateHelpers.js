/**
 * Resolve date strings from user input.
 * Handles: "today", "tomorrow", "1", "2", "3", or a DD/MM/YYYY string.
 */
export function resolveDate(input) {
  const cleaned = input.trim().toLowerCase()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (cleaned === '1' || cleaned === 'today') {
    return today
  }

  if (cleaned === '2' || cleaned === 'tomorrow') {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow
  }

  // Try parsing DD/MM/YYYY
  const parts = cleaned.split(/[\/\-.]/)
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts.map(Number)
    const date = new Date(yyyy, mm - 1, dd)
    if (!isNaN(date.getTime()) && date >= today) {
      return date
    }
  }

  return null // invalid
}

/**
 * Safely parse any date string into a Date object without JS MM/DD/YYYY ambiguity.
 */
export function parseAnyDate(input) {
  if (!input) return null
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input

  const str = String(input).trim()
  const ddmmyyyy = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy.map(Number)
    const d = new Date(yyyy, mm - 1, dd)
    return isNaN(d.getTime()) ? null : d
  }
  const yyyymmdd = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (yyyymmdd) {
    const [, yyyy, mm, dd] = yyyymmdd.map(Number)
    const d = new Date(yyyy, mm - 1, dd)
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Format date for display in WhatsApp messages.
 */
export function formatDateDisplay(date) {
  const d = parseAnyDate(date) || new Date(date)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Format date to DD/MM/YYYY Indian format.
 */
export function formatDateIndian(date) {
  const d = parseAnyDate(date)
  if (!d) return String(date || '')
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/**
 * Get date string in YYYY-MM-DD format (local date).
 */
export function toDateString(date) {
  const d = parseAnyDate(date) || new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Build a list of upcoming date options (default: next 7 days from today)
 * each with a friendly label + icon, ready for the WhatsApp date template.
 */
export function getDateOptions(count = 7) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekdays = [
    ['Sunday', 'रविवार'],
    ['Monday', 'सोमवार'],
    ['Tuesday', 'मंगलवार'],
    ['Wednesday', 'बुधवार'],
    ['Thursday', 'गुरुवार'],
    ['Friday', 'शुक्रवार'],
    ['Saturday', 'शनिवार'],
  ]

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const [enDay, hiDay] = weekdays[d.getDay()]
    let label
    if (i === 0) label = 'Today / आज'
    else if (i === 1) label = 'Tomorrow / कल'
    else label = `${enDay} / ${hiDay}`
    return {
      date: d,
      label,
      dateStr: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
    }
  })
}
