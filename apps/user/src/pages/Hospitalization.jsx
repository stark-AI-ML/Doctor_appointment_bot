import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Eye, CheckCircle, XCircle, BedDouble, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'
import Table from '../components/common/Table'
import StatusBadge from '../components/common/StatusBadge'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { Loader } from '../components/common/Loader'
import { bookingService } from '../services/bookingService'
import PrintSlipHandler from '../services/PrintSlipHandler'
import { printService } from '../services/printService'
import { isMockMode } from '../services/api'
import { formatDate } from '../utils/formatters'
import styles from './Hospitalization.module.css'

export default function Hospitalization() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedReq, setSelectedReq] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [staffNotes, setStaffNotes] = useState('')

  // Query - we fetch bookings but filter by type=HOSPITALIZATION
  const { data: response, isLoading } = useQuery({
    queryKey: ['hospitalization', search],
    queryFn: () => bookingService.getBookings({ type: 'HOSPITALIZATION', search }),
    refetchInterval: isMockMode() ? false : 30000,
  })

  // Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => bookingService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitalization'] })
      toast.success('Hospitalization request updated')
      setShowDetail(false)
    },
    onError: () => toast.error('Failed to update status'),
  })

  const handleStatusChange = (id, newStatus) => {
    statusMutation.mutate({ id, status: newStatus })
  }

  const handleViewDetail = (req) => {
    setSelectedReq(req)
    // Note: booking model doesn't strictly have staff_notes right now, we can just use a local state or add it later
    setStaffNotes('')
    setShowDetail(true)
  }

  // Print flow: enrich the row with patient details first so the
  // ticket renders real data (age, gender, address, UHID).
  const handlePrint = async (req) => {
    try {
      const slipData = await printService.getSlipData(req)
      PrintSlipHandler.printBooking(slipData)
    } catch (err) {
      toast.error('Could not load ticket data')
    }
  }

  const requests = response?.data || []
  const columns = ['Request ID', 'Patient', 'Mobile', 'Pref. Date', 'Status', 'Actions']

  const renderRow = (req) => (
    <tr key={req.id}>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <span className={styles.requestId}>{req.booking_id}</span>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        {req.patient_name}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        {req.mobile}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        {formatDate(req.date)}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <StatusBadge status={req.status} />
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div className={styles.rowActions}>
          <button className={styles.actionBtn} onClick={() => handleViewDetail(req)} title="View Details">
            <Eye size={16} />
          </button>
          <button
            className={styles.actionBtn}
            onClick={() => handlePrint(req)}
            title="Print IPD Admission Ticket"
          >
            <Printer size={16} />
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className={styles.page}>
      <PageHeader
        title="Hospitalization (IPD)"
        subtitle="IPD admission requests · confirm or cancel after the staff call"
        icon={BedDouble}
      />
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIconInline} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card noPadding>
        {isLoading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
            <Loader size="lg" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={requests}
            renderRow={renderRow}
            emptyMessage="No hospitalization requests found."
          />
        )}
      </Card>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Hospitalization Request Details"
        footer={
          <>
            {selectedReq?.status === 'pending' ? (
              <>
                <Button icon={CheckCircle} onClick={() => handleStatusChange(selectedReq.id, 'confirmed')} disabled={statusMutation.isPending}>
                  Confirm Admission
                </Button>
                <Button
                  icon={Printer}
                  onClick={() => {
                    handleStatusChange(selectedReq.id, 'confirmed')
                    handlePrint({ ...selectedReq, status: 'confirmed' })
                    setShowDetail(false)
                  }}
                  disabled={statusMutation.isPending}
                >
                  Confirm & Print Ticket
                </Button>
                <Button variant="danger" icon={XCircle} onClick={() => handleStatusChange(selectedReq.id, 'cancelled')} disabled={statusMutation.isPending}>
                  Cancel Request
                </Button>
              </>
            ) : (
              <Button
                icon={Printer}
                variant="secondary"
                onClick={() => handlePrint(selectedReq)}
              >
                Print Ticket
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowDetail(false)}>
              Close
            </Button>
          </>
        }
      >
        {selectedReq && (
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Request ID</span>
              <span className={styles.detailValue}>{selectedReq.booking_id}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status</span>
              <StatusBadge status={selectedReq.status} />
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Patient Name</span>
              <span className={styles.detailValue}>{selectedReq.patient_name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Mobile</span>
              <span className={styles.detailValue}>{selectedReq.mobile}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Preferred Date</span>
              <span className={styles.detailValue}>{formatDate(selectedReq.date)}</span>
            </div>
            <div className={styles.detailItemFull}>
              <span className={styles.detailLabel}>Patient Problem / Reason</span>
              <div className={styles.textBlock}>{selectedReq.problemDescription || 'No problem described.'}</div>
            </div>
            <div className={styles.detailItemFull}>
              <span className={styles.detailLabel}>Staff Notes (Internal)</span>
              <textarea 
                className={styles.textarea} 
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                placeholder="Enter notes after calling the patient..."
                disabled={selectedReq.status !== 'pending'}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
