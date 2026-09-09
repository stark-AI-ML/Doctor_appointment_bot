import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Eye, Users, Filter } from 'lucide-react'
import { patientService } from '../services/patientService'
import { useDebounce } from '../hooks/useDebounce'
import { formatDate, formatPhone, getInitials } from '../utils/formatters'
import Card from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'
import Table from '../components/common/Table'
import Modal from '../components/common/Modal'
import StatusBadge from '../components/common/StatusBadge'
import { Loader } from '../components/common/Loader'
import styles from './Patients.module.css'

export default function Patients() {
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'old' | 'new'
  const [sortBy, setSortBy] = useState('lastVisit')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const debouncedSearch = useDebounce(search, 400)

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', debouncedSearch, filterTab, sortBy, sortOrder],
    queryFn: () => {
      const isOld = filterTab === 'old' ? 'true' : filterTab === 'new' ? 'false' : ''
      return patientService.getPatients(debouncedSearch, isOld, sortBy, sortOrder)
    },
  })

  const { data: patientDetail } = useQuery({
    queryKey: ['patient', selectedPatient?.id],
    queryFn: () => patientService.getPatient(selectedPatient.id),
    enabled: !!selectedPatient,
  })

  const columns = ['Patient', 'Type / Status', 'Mobile', 'Total Bookings', 'Last Visit', 'Action']

  const renderRow = (patient) => (
    <tr key={patient.id}>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div className={styles.patientRow}>
          <div className={styles.patientAvatar}>{getInitials(patient.name)}</div>
          <span className={styles.patientName}>{patient.name}</span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <span className={`${styles.typeBadge} ${patient.is_old ? styles.oldBadge : styles.newBadge}`}>
          {patient.is_old ? 'Old Patient' : 'New Patient'}
        </span>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
        {formatPhone(patient.mobile)}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        {patient.total_bookings}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '13px' }}>
        {formatDate(patient.last_visit)}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <button
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, color: 'var(--text-secondary)', transition: 'all 0.15s' }}
          onClick={() => setSelectedPatient(patient)}
          title="View History"
        >
          <Eye size={16} />
        </button>
      </td>
    </tr>
  )

  return (
    <div className={styles.page}>
      <PageHeader
        title="Patients"
        subtitle="Everyone registered via WhatsApp or front desk · filter and sort by New vs Old Patient status"
        icon={Users}
      />
      <div className={styles.filterContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${filterTab === 'all' ? styles.activeTab : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Patients
          </button>
          <button
            className={`${styles.tab} ${filterTab === 'old' ? styles.activeTab : ''}`}
            onClick={() => setFilterTab('old')}
          >
            Old Patients (पुराना मरीज)
          </button>
          <button
            className={`${styles.tab} ${filterTab === 'new' ? styles.activeTab : ''}`}
            onClick={() => setFilterTab('new')}
          >
            New Patients (नया मरीज)
          </button>
        </div>

        <div className={styles.controlsGroup}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="patient-search"
            />
          </div>

          <div className={styles.sortWrapper}>
            <Filter size={15} className={styles.filterIcon} />
            <select
              className={styles.sortSelect}
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split(':')
                setSortBy(by)
                setSortOrder(order)
              }}
            >
              <option value="lastVisit:desc">Last Visit (Newest First)</option>
              <option value="lastVisit:asc">Last Visit (Oldest First)</option>
              <option value="name:asc">Name (A – Z)</option>
              <option value="name:desc">Name (Z – A)</option>
              <option value="isOld:desc">Old Patients First</option>
              <option value="isOld:asc">New Patients First</option>
            </select>
          </div>
        </div>
      </div>

      <Card noPadding>
        {isLoading ? <Loader /> : (
          <Table columns={columns} data={patients || []} renderRow={renderRow} emptyMessage="No patients found" />
        )}
      </Card>

      <Modal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title={`${selectedPatient?.name || ''} — Booking History`}
      >
        {patientDetail?.bookings?.length > 0 ? (
          <div className={styles.historyList}>
            {patientDetail.bookings.map((b) => (
              <div key={b.id} className={styles.historyItem}>
                <div>
                  <strong>{b.booking_id}</strong>
                  <div className={styles.historyMeta}>
                    {b.doctor_name} • {formatDate(b.date)} • {b.time_slot}
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No booking history</p>
        )}
      </Modal>
    </div>
  )
}
