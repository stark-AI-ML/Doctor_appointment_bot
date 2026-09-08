/**
 * Formatters — pure utility functions for display formatting.
 * No side effects, easy to test, reusable everywhere.
 */

/**
 * Safely parse any date representation into a JavaScript Date object,
 * avoiding V8 native `new Date("08/09/2026")` ambiguity which parses MM/DD/YYYY.
 */
export function parseAnyDate(input) {
  if (!input) return null
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input

  const str = String(input).trim()

  // Match Indian format: DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy.map(Number)
    const d = new Date(yyyy, mm - 1, dd)
    return isNaN(d.getTime()) ? null : d
  }

  // Match ISO date format: YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (yyyymmdd) {
    const [, yyyy, mm, dd] = yyyymmdd.map(Number)
    const d = new Date(yyyy, mm - 1, dd)
    return isNaN(d.getTime()) ? null : d
  }

  // Fallback to standard JS Date parsing for ISO timestamps etc.
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Format date string to Indian standard DD/MM/YYYY format
 * @param {string|Date} dateStr - ISO date string, YYYY-MM-DD, DD/MM/YYYY, or Date object
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'

  // If already a DD/MM/YYYY string, format cleanly with leading zeros without re-parsing
  if (typeof dateStr === 'string') {
    const trimmed = dateStr.trim()
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
    if (ddmmyyyy) {
      const [, dd, mm, yyyy] = ddmmyyyy
      return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`
    }
  }

  const d = parseAnyDate(dateStr)
  if (!d) return String(dateStr)

  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export function formatIndianDate(dateStr) {
  return formatDate(dateStr)
}

/**
 * Format date to relative time (e.g. "2 hours ago")
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—'
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateStr)
}

/**
 * Format currency (INR)
 */
export function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format phone number
 */
export function formatPhone(phone) {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return phone
}

/**
 * Format large numbers with K/M suffix
 */
export function formatCompact(num) {
  if (num == null) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

/**
 * Get initials from a name (for avatar placeholders)
 */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
