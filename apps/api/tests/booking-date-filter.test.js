import { describe, it, expect, vi } from 'vitest'
import bookingService from '../src/modules/booking/booking.service.js'
import bookingRepo from '../src/modules/booking/booking.repository.js'
import patientRepo from '../src/modules/patient/patient.repository.js'

describe('BookingService - Date Filter (preferredDate)', () => {
  it('builds a single-day preferredDate range for `date`', async () => {
    const spy = vi.spyOn(bookingRepo, 'findAll').mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    })

    await bookingService.getBookings({ date: '2026-08-20' })

    const start = new Date(2026, 7, 20, 0, 0, 0, 0)
    const end = new Date(2026, 7, 20, 23, 59, 59, 999)

    expect(spy).toHaveBeenCalledWith(
      { $and: [{ preferredDate: { $gte: start, $lte: end } }] },
      { page: 1, limit: 10, sortBy: 'preferredDate', sortOrder: 'desc' }
    )

    spy.mockRestore()
  })

  it('AND-combines date + search instead of overwriting the date filter', async () => {
    const repoSpy = vi.spyOn(bookingRepo, 'findAll').mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 30,
      totalPages: 0,
    })
    const patientSpy = vi.spyOn(patientRepo, 'search').mockResolvedValue([])

    await bookingService.getBookings({ date: '2026-08-20', search: 'ram', limit: 30 })

    const start = new Date(2026, 7, 20, 0, 0, 0, 0)
    const end = new Date(2026, 7, 20, 23, 59, 59, 999)

    expect(repoSpy).toHaveBeenCalledWith(
      {
        $and: [
          { preferredDate: { $gte: start, $lte: end } },
          { $or: [{ bookingId: expect.any(RegExp) }, { patientId: { $in: [] } }] },
        ],
      },
      { page: 1, limit: 30, sortBy: 'preferredDate', sortOrder: 'desc' }
    )

    repoSpy.mockRestore()
    patientSpy.mockRestore()
  })

  it('builds preferredDate range for startDate/endDate with desc default', async () => {
    const spy = vi.spyOn(bookingRepo, 'findAll').mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    })

    await bookingService.getBookings({ startDate: '2026-08-01', endDate: '2026-08-15' })

    const start = new Date(2026, 7, 1, 0, 0, 0, 0)
    const end = new Date(2026, 7, 15, 23, 59, 59, 999)

    expect(spy).toHaveBeenCalledWith(
      { $and: [{ preferredDate: { $gte: start, $lte: end } }] },
      { page: 1, limit: 10, sortBy: 'preferredDate', sortOrder: 'desc' }
    )

    spy.mockRestore()
  })
})
