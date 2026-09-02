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
