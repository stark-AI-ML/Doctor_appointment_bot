import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Download, Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { bookingService } from '../services/bookingService'
import { doctorService } from '../services/doctorService'
import { useDebounce } from '../hooks/useDebounce'
import { formatDate, formatPhone } from '../utils/formatters'
import { BOOKING_STATUS } from '../utils/constants'
import Card from '../components/common/Card'
import Table from '../components/common/Table'
import StatusBadge from '../components/common/StatusBadge'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { Loader } from '../components/common/Loader'
import styles from './Bookings.module.css'

export default function Bookings() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  // Fetch doctors for filter dropdown
  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: doctorService.getDoctors,
  })

  // Fetch bookings with filters
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', { page, status: statusFilter, doctor_id: doctorFilter, search: debouncedSearch }],
    queryFn: () =>
      bookingService.getBookings({
        page,
        limit: 10,
        status: statusFilter,
        doctor_id: doctorFilter,
        search: debouncedSearch,
      }),
    keepPreviousData: true,
  })

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => bookingService.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success(`Booking ${variables.status}!`)
    },
    onError: () => toast.error('Failed to update status'),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => bookingService.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Booking deleted')
    },
    onError: () => toast.error('Failed to delete booking'),
  })

  const handleStatusChange = (id, status) => {
    statusMutation.mutate({ id, status })
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleViewDetail = (booking) => {
    setSelectedBooking(booking)
    setShowDetail(true)
  }

  const bookings = bookingsData?.data || []
  const pagination = bookingsData
    ? {
        page: bookingsData.page,
        totalPages: bookingsData.totalPages,
        total: bookingsData.total,
        limit: bookingsData.limit,
        onPageChange: setPage,
      }
    : null

  const columns = ['Booking ID', 'Patient', 'Doctor', 'Date', 'Time', 'Status', 'Actions']

  const renderRow = (booking) => (
    <tr key={booking.id}>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <span className={styles.bookingId}>{booking.booking_id}</span>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div className={styles.patientInfo}>
          <span>{booking.patient_name}</span>
          <span className={styles.patientMobile}>{formatPhone(booking.mobile)}</span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        {booking.doctor_name}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '13px' }}>
        {formatDate(booking.date)}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        {booking.time_slot}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <StatusBadge status={booking.status} />
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div className={styles.rowActions}>
          <button
            className={styles.actionBtn}
            onClick={() => handleViewDetail(booking)}
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {booking.status === BOOKING_STATUS.PENDING && (
            <button
              className={`${styles.actionBtn} ${styles.confirm}`}
              onClick={() => handleStatusChange(booking.id, BOOKING_STATUS.CONFIRMED)}
              title="Confirm"
            >
              <CheckCircle size={16} />
            </button>
          )}
          {booking.status !== BOOKING_STATUS.CANCELLED && booking.status !== BOOKING_STATUS.COMPLETED && (
            <button
              className={`${styles.actionBtn} ${styles.cancel}`}
              onClick={() => handleStatusChange(booking.id, BOOKING_STATUS.CANCELLED)}
              title="Cancel"
            >
              <XCircle size={16} />
            </button>
          )}
          <button
            className={`${styles.actionBtn} ${styles.cancel}`}
            onClick={() => handleDelete(booking.id)}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className={styles.page}>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIconInline} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name, ID, or mobile..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              id="booking-search"
            />
          </div>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            id="status-filter"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className={styles.select}
            value={doctorFilter}
            onChange={(e) => {
              setDoctorFilter(e.target.value)
              setPage(1)
            }}
            id="doctor-filter"
          >
            <option value="">All Doctors</option>
            {doctors?.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" icon={Download} size="sm">
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <Card noPadding>
        {isLoading ? (
          <Loader />
        ) : (
          <Table
            columns={columns}
            data={bookings}
            renderRow={renderRow}
            pagination={pagination}
            emptyMessage="No bookings found"
          />
        )}
      </Card>

      {/* ── Detail Modal ── */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Booking Details"
        footer={
          <>
            {selectedBooking?.status === BOOKING_STATUS.PENDING && (
              <Button
                icon={CheckCircle}
                onClick={() => {
                  handleStatusChange(selectedBooking.id, BOOKING_STATUS.CONFIRMED)
                  setShowDetail(false)
                }}
              >
                Confirm
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowDetail(false)}>
              Close
            </Button>
          </>
        }
      >
        {selectedBooking && (
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Booking ID</span>
              <span className={styles.detailValue}>{selectedBooking.booking_id}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status</span>
              <StatusBadge status={selectedBooking.status} />
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Patient Name</span>
              <span className={styles.detailValue}>{selectedBooking.patient_name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Mobile</span>
              <span className={styles.detailValue}>{formatPhone(selectedBooking.mobile)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Doctor</span>
              <span className={styles.detailValue}>{selectedBooking.doctor_name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Service</span>
              <span className={styles.detailValue}>{selectedBooking.service_name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Date</span>
              <span className={styles.detailValue}>{formatDate(selectedBooking.date)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Time</span>
              <span className={styles.detailValue}>{selectedBooking.time_slot}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Created</span>
              <span className={styles.detailValue}>{formatDate(selectedBooking.created_at)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Updated</span>
              <span className={styles.detailValue}>{formatDate(selectedBooking.updated_at)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
