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
 * Format date for display in WhatsApp messages.
 */
export function formatDateDisplay(date) {
  const d = new Date(date)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Get date string in YYYY-MM-DD format.
 */
export function toDateString(date) {
  const d = new Date(date)
  return d.toISOString().slice(0, 10)
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
  const icons = ['📆', '🗓️', '📅', '📅', '📅', '📅', '📅']

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
      icon: icons[i] || '📅',
      dateStr: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
    }
  })
}
