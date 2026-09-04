import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Eye, CheckCircle, Truck, PackageCheck, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import Table from '../components/common/Table'
import StatusBadge from '../components/common/StatusBadge'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { Loader } from '../components/common/Loader'
import { medicineOrderService } from '../services/medicineOrderService'
import { isMockMode } from '../services/api'
import styles from './MedicineOrders.module.css'

export default function MedicineOrders() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [staffNotes, setStaffNotes] = useState('')

  // Query
  const { data: response, isLoading } = useQuery({
    queryKey: ['medicineOrders', search],
    queryFn: () => medicineOrderService.getOrders({ search }),
    refetchInterval: isMockMode() ? false : 30000,
  })

  // Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }) => medicineOrderService.updateStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicineOrders'] })
      toast.success('Order status updated')
      setShowDetail(false)
    },
    onError: () => toast.error('Failed to update status'),
  })

  const handleStatusChange = (id, newStatus) => {
    statusMutation.mutate({ id, status: newStatus, notes: staffNotes })
  }

  const handleViewDetail = (order) => {
    setSelectedOrder(order)
    setStaffNotes(order.staff_notes || '')
    setShowDetail(true)
  }

  const columns = ['Order ID', 'Patient', 'Mobile', 'Status', 'Actions']
  const orders = response?.data || []

  const renderRow = (order) => (
    <tr key={order.id}>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <span className={styles.orderId}>{order.order_id}</span>
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        {order.patient_name}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        {order.mobile}
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <StatusBadge status={order.status} />
      </td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div className={styles.rowActions}>
          <button className={styles.actionBtn} onClick={() => handleViewDetail(order)} title="View Details">
            <Eye size={16} />
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className={styles.page}>
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
            data={orders}
            renderRow={renderRow}
            emptyMessage="No medicine orders found."
          />
        )}
      </Card>

      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Medicine Order Details"
        footer={
          <>
            {selectedOrder?.status === 'pending' && (
              <Button icon={CheckCircle} onClick={() => handleStatusChange(selectedOrder.id, 'processing')} disabled={statusMutation.isPending}>
                Accept & Process
              </Button>
            )}
            {selectedOrder?.status === 'processing' && (
              <Button icon={Truck} onClick={() => handleStatusChange(selectedOrder.id, 'dispatched')} disabled={statusMutation.isPending}>
                Mark Dispatched
              </Button>
            )}
            {selectedOrder?.status === 'dispatched' && (
              <Button icon={PackageCheck} onClick={() => handleStatusChange(selectedOrder.id, 'completed')} disabled={statusMutation.isPending}>
                Mark Delivered
              </Button>
            )}
            {(selectedOrder?.status === 'pending' || selectedOrder?.status === 'processing') && (
              <Button variant="danger" icon={XCircle} onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')} disabled={statusMutation.isPending}>
                Cancel Order
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowDetail(false)}>
              Close
            </Button>
          </>
        }
      >
        {selectedOrder && (
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Order ID</span>
              <span className={styles.detailValue}>{selectedOrder.order_id}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status</span>
              <StatusBadge status={selectedOrder.status} />
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Patient Name</span>
              <span className={styles.detailValue}>{selectedOrder.patient_name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Mobile</span>
              <span className={styles.detailValue}>{selectedOrder.mobile}</span>
            </div>
            <div className={styles.detailItemFull}>
              <span className={styles.detailLabel}>Delivery Address</span>
              <div className={styles.textBlock}>{selectedOrder.address}</div>
            </div>
            {selectedOrder.customer_notes && (
              <div className={styles.detailItemFull}>
                <span className={styles.detailLabel}>Customer Notes</span>
                <div className={styles.textBlock}>{selectedOrder.customer_notes}</div>
              </div>
            )}
            <div className={styles.detailItemFull}>
              <span className={styles.detailLabel}>Prescription Image</span>
              <div className={styles.imageBox}>
                <img src={selectedOrder.prescription_url.startsWith('http') ? selectedOrder.prescription_url : `http://localhost:3000${selectedOrder.prescription_url}`} alt="Prescription" />
              </div>
            </div>
            <div className={styles.detailItemFull}>
              <span className={styles.detailLabel}>Staff Notes (Internal)</span>
              <textarea 
                className={styles.textarea} 
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                placeholder="Enter pricing details or notes..."
                disabled={selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled'}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
