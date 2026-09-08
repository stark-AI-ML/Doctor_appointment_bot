import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit3, Trash2, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'
import { doctorService } from '../services/doctorService'
import { formatCurrency, getInitials } from '../utils/formatters'
import { SPECIALIZATIONS } from '../utils/constants'
import Button from '../components/common/Button'
import PageHeader from '../components/common/PageHeader'
import Modal from '../components/common/Modal'
import { Loader } from '../components/common/Loader'
import styles from './Doctors.module.css'

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #25D366, #128C7E)',
  'linear-gradient(135deg, #58a6ff, #388bfd)',
  'linear-gradient(135deg, #bc8cff, #8b5cf6)',
  'linear-gradient(135deg, #f0883e, #e3642b)',
  'linear-gradient(135deg, #f778ba, #d63384)',
  'linear-gradient(135deg, #56d4dd, #2b9ea6)',
]

const emptyForm = {
  name: '',
  specialization: '',
  consultation_fee: '',
  phone: '',
  email: '',
}

export default function Doctors() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: doctorService.getDoctors,
  })

  const createMutation = useMutation({
    mutationFn: doctorService.createDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      toast.success('Doctor added!')
      closeForm()
    },
    onError: () => toast.error('Failed to add doctor'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => doctorService.updateDoctor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      toast.success('Doctor updated!')
      closeForm()
    },
    onError: () => toast.error('Failed to update doctor'),
  })

  const deleteMutation = useMutation({
    mutationFn: doctorService.deleteDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      toast.success('Doctor deleted')
    },
    onError: () => toast.error('Failed to delete doctor'),
  })

  const toggleMutation = useMutation({
    mutationFn: doctorService.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
    },
  })

  const openAdd = () => {
    setEditingDoctor(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (doctor) => {
    setEditingDoctor(doctor)
    setForm({
      name: doctor.name,
      specialization: doctor.specialization,
      consultation_fee: doctor.consultation_fee,
      phone: doctor.phone || '',
      email: doctor.email || '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingDoctor(null)
    setForm(emptyForm)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...form,
      consultation_fee: Number(form.consultation_fee),
    }
    if (editingDoctor) {
      updateMutation.mutate({ id: editingDoctor.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this doctor?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) return <Loader />

  return (
    <div className={styles.page}>
      <PageHeader
        title="Doctors"
        subtitle={`${doctors?.length || 0} doctors registered · toggle availability or manage profiles`}
        icon={Stethoscope}
        actions={<Button icon={Plus} onClick={openAdd}>Add Doctor</Button>}
      />

      <div className={styles.grid}>
        {doctors?.map((doctor, i) => (
          <div
            key={doctor.id}
            className={styles.doctorCard}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            {/* Active Toggle */}
            <div className={styles.statusToggle}>
              <button
                className={`${styles.toggle} ${doctor.is_active ? styles.active : ''}`}
                onClick={() => toggleMutation.mutate(doctor.id)}
                title={doctor.is_active ? 'Active' : 'Inactive'}
              />
            </div>

            {/* Header */}
            <div className={styles.doctorHeader}>
              <div
                className={styles.doctorAvatar}
                style={{ background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }}
              >
                {getInitials(doctor.name)}
              </div>
              <div>
                <div className={styles.doctorName}>{doctor.name}</div>
                <div className={styles.doctorSpec}>{doctor.specialization}</div>
              </div>
            </div>

            {/* Meta */}
            <div className={styles.doctorMeta}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Consultation Fee</span>
                <span className={styles.metaValue}>{formatCurrency(doctor.consultation_fee)}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Status</span>
                <span
                  className={styles.metaValue}
                  style={{ color: doctor.is_active ? 'var(--primary)' : 'var(--status-cancelled)' }}
                >
                  {doctor.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.doctorActions}>
              <Button variant="secondary" size="sm" icon={Edit3} onClick={() => openEdit(doctor)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(doctor.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add/Edit Modal ── */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name || !form.specialization || !form.consultation_fee}
            >
              {editingDoctor ? 'Update' : 'Add Doctor'}
            </Button>
          </>
        }
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Name *</label>
            <input
              className={styles.formInput}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Dr. Full Name"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Specialization *</label>
            <select
              className={styles.formInput}
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              required
            >
              <option value="">Select specialization</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Consultation Fee (₹) *</label>
            <input
              className={styles.formInput}
              type="number"
              value={form.consultation_fee}
              onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })}
              placeholder="500"
              min="0"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Phone</label>
            <input
              className={styles.formInput}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input
              className={styles.formInput}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="doctor@clinic.com"
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
