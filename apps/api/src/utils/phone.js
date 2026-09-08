/**
 * Phone normalization — single home for "same number" semantics.
 * Both the WhatsApp bot and the receptionist UI must call this,
 * otherwise one UHID will silently split across formats
 * (e.g. '98765 43210' vs '919876543210').
 */
export function normalizePhone(raw) {
  if (raw === null || raw === undefined) return ''
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  return digits // unknown shape — keep as-is, callers log a warning
}
