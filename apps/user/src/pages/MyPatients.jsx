import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Eye, Stethoscope } from 'lucide-react'
import { bookingService } from '../services/bookingService'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import { formatDate, formatPhone, getInitials } from '../utils/formatters'
import Card from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'
import Table from '../components/common/Table'
import Modal from '../components/common/Modal'
import StatusBadge from '../components/common/StatusBadge'
import { Loader } from '../components/common/Loader'
import styles from './MyPatients.module.css'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * Doctor's "My Patients" — only bookings where doctorId == my doctorId.
 * Derived from bookings (no junction table). Token column doubles as the
 * daily queue serial (R9).
 */
export default function MyPatients() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const debouncedSearch = useDebounce(search, 400)

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['my-bookings', user?.doctorId],
    queryFn: () => bookingService.getBookings({ limit: 100, doctor_id: user?.doctorId }),
    enabled: !!user?.doctorId,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => bookingService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      toast.success('Patient status updated')
      setSelected(null)
    },
    onError: () => toast.error('Failed to update patient status'),
  })

  const rows = useMemo(() => {
    let list = (bookingsData?.data || []).filter((b) => b.status !== 'cancelled')
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        (b) => b.patient_name.toLowerCase().includes(q) || (b.token_number || '').toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => (a.token_number || '').localeCompare(b.token_number || ''))
  }, [bookingsData, debouncedSearch])

  const columns = ['Token', 'Patient', 'UHID', 'Mobile', 'Date', 'Status', 'Action']

  const renderRow = (b) => (
    <tr key={b.id}>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <span className={styles.token}>{b.token_number || '—'}</span>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div className={styles.patientRow}>
          <div className={styles.patientAvatar}>{getInitials(b.patient_name)}</div>
          <span className={styles.patientName}>{b.patient_name}</span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '13px' }}>
        {b.uhid || '—'}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
        {formatPhone(b.mobile)}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '13px' }}>
        {formatDate(b.date)}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <StatusBadge status={b.status} />
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, color: 'var(--text-secondary)', background: 'var(--bg-elevated)' }}
            onClick={() => setSelected(b)}
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {b.status === 'confirmed' && (
            <button
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, color: 'var(--accent-blue)', background: 'rgba(88, 166, 255, 0.12)' }}
              onClick={() => statusMutation.mutate({ id: b.id, status: 'completed' })}
              title="Mark Visit Completed"
            >
              <CheckCheck size={16} />
            </button>
          )}
          {b.status === 'pending' && (
            <button
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, color: 'var(--primary)', background: 'var(--primary-glow)' }}
              onClick={() => statusMutation.mutate({ id: b.id, status: 'confirmed' })}
              title="Confirm Patient"
            >
              <CheckCircle size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  )

  if (!user?.doctorId) {
    return (
      <div className={styles.page}>
        <Card><p style={{ color: 'var(--text-muted)' }}>No doctor profile linked to this login.</p></Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="My Patients"
        subtitle="Only patients assigned to you · token doubles as your daily queue serial"
        icon={Stethoscope}
      />
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search by patient or token (T-001)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="mypatients-search"
        />
      </div>

      <Card noPadding>
        {isLoading ? <Loader /> : (
          <Table columns={columns} data={rows} renderRow={renderRow} emptyMessage="No patients assigned to you yet" />
        )}
      </Card>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`${selected?.patient_name || ''} — Visit Details`}
      >
        {selected && (
          <div className={styles.detailList}>
            <div className={styles.detailRow}><span>Token</span><strong>{selected.token_number || '—'}</strong></div>
            <div className={styles.detailRow}><span>UHID</span><strong>{selected.uhid || '—'}</strong></div>
            <div className={styles.detailRow}><span>Booking</span><strong>{selected.booking_id}</strong></div>
            <div className={styles.detailRow}><span>Date</span><strong>{formatDate(selected.date)}</strong></div>
            <div className={styles.detailRow}><span>Status</span><StatusBadge status={selected.status} /></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
