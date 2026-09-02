/**
 * Shared booking status enum — used by both API and admin frontend.
 */
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export const BOOKING_SOURCE = {
  WHATSAPP: 'whatsapp',
  ADMIN: 'admin',
  MANUAL: 'manual',
}
