import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit3, Trash2, Stethoscope, Star, Phone, Mail, Camera, UploadCloud, X, User, IndianRupee, Check } from 'lucide-react'
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
  'linear-gradient(135deg, #0284c7, #0369a1)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #f97316, #c2410c)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #06b6d4, #0e7490)',
]

// Mock ratings for presentation
const RATINGS = ['4.9', '5.0', '4.8', '4.7', '4.9', '4.8']

const emptyForm = {
  name: '',
  specialization: '',
  consultation_fee: '',
  phone: '',
  email: '',
  avatar: '',
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
      avatar: doctor.avatar || '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingDoctor(null)
    setForm(emptyForm)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, avatar: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, avatar: '' }))
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
        {doctors?.map((doctor, i) => {
          return (
            <div
              key={doctor.id}
              className={styles.doctorCard}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {/* Card Top Bar: Active Switch */}
              <div className={styles.cardTopRow}>
                <div />
                <div className={styles.statusToggle}>
                  <button
                    type="button"
                    className={`${styles.toggle} ${doctor.is_active ? styles.active : ''}`}
                    onClick={() => toggleMutation.mutate(doctor.id)}
                    title={doctor.is_active ? 'Online / Available' : 'Offline / Inactive'}
                    aria-label="Toggle active status"
                  />
                </div>
              </div>

              {/* Centered Doctor Profile Info */}
              <div className={styles.profileSection}>
                <div className={styles.avatarWrapper}>
                  {doctor.avatar ? (
                    <img
                      src={doctor.avatar}
                      alt={doctor.name}
                      className={styles.doctorAvatarImg}
                    />
                  ) : (
                    <div
                      className={styles.doctorAvatar}
                      style={{ background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length] }}
                    >
                      {getInitials(doctor.name)}
                    </div>
                  )}
                </div>

                <h3 className={styles.doctorName}>{doctor.name}</h3>
                <p className={styles.doctorContact}>
                  {doctor.email || doctor.phone || 'KG Nanda Hospital'}
                </p>

                <div className={styles.specBadgeWrapper}>
                  <span className={styles.specBadge}>{doctor.specialization}</span>
                </div>
              </div>

              {/* Consultation Fee & Status */}
              <div className={styles.doctorMeta}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Consultation Fee</span>
                  <span className={styles.metaValue}>{formatCurrency(doctor.consultation_fee)}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Status</span>
                  <span
                    className={`${styles.statusPill} ${
                      doctor.is_active ? styles.statusActive : styles.statusInactive
                    }`}
                  >
                    <span className={styles.statusDot} />
                    {doctor.is_active ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.doctorActions}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => openEdit(doctor)}
                  title="Edit profile"
                >
                  <Edit3 size={14} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(doctor.id)}
                  title="Delete doctor"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Add/Edit Modal ── */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingDoctor ? 'Edit Doctor Profile' : 'Add New Doctor'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              icon={Check}
              onClick={handleSubmit}
              disabled={!form.name || !form.specialization || !form.consultation_fee}
            >
              {editingDoctor ? 'Update Profile' : 'Add Doctor'}
            </Button>
          </>
        }
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Doctor Photo Upload Hero Card */}
          <div className={styles.imageUploadCard}>
            <div className={styles.avatarPickerWrapper}>
              <div className={styles.imagePreviewCircle}>
                {form.avatar ? (
                  <img src={form.avatar} alt="Doctor Preview" className={styles.previewImg} />
                ) : (
                  <div className={styles.previewPlaceholder}>
                    <Camera size={26} className={styles.cameraIcon} />
                  </div>
                )}
              </div>
              <label
                htmlFor="doctor-avatar-upload"
                className={styles.avatarCameraBadge}
                title="Upload photo"
              >
                <Camera size={13} />
              </label>
            </div>

            <div className={styles.uploadInfoContent}>
              <div className={styles.uploadTitleRow}>
                <span className={styles.uploadMainTitle}>Doctor Photo</span>
                <span className={styles.uploadHint}>JPG, PNG or WEBP (Max 2MB)</span>
              </div>
              <div className={styles.uploadActionButtons}>
                <label className={styles.uploadBtnLabel} htmlFor="doctor-avatar-upload">
                  <UploadCloud size={14} />
                  <span>{form.avatar ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    id="doctor-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={styles.hiddenFileInput}
                  />
                </label>
                {form.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className={styles.removePhotoBtn}
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Full Name <span className={styles.reqStar}>*</span>
            </label>
            <div className={styles.inputWithIcon}>
              <User size={16} className={styles.inputLeadingIcon} />
              <input
                className={styles.formInput}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Dr. Full Name"
                required
              />
            </div>
          </div>

          <div className={styles.formRowTwo}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Specialization <span className={styles.reqStar}>*</span>
              </label>
              <div className={styles.inputWithIcon}>
                <Stethoscope size={16} className={styles.inputLeadingIcon} />
                <select
                  className={`${styles.formInput} ${styles.formSelect}`}
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
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Consultation Fee (₹) <span className={styles.reqStar}>*</span>
              </label>
              <div className={styles.inputWithIcon}>
                <IndianRupee size={16} className={styles.inputLeadingIcon} />
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
            </div>
          </div>

          <div className={styles.formRowTwo}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone Number</label>
              <div className={styles.inputWithIcon}>
                <Phone size={16} className={styles.inputLeadingIcon} />
                <input
                  className={styles.formInput}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 00001"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email Address</label>
              <div className={styles.inputWithIcon}>
                <Mail size={16} className={styles.inputLeadingIcon} />
                <input
                  className={styles.formInput}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="doctor@kgnanda.com"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

