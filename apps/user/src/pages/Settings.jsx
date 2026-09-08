import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Settings as SettingsIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsService } from '../services/settingsService'
import Button from '../components/common/Button'
import PageHeader from '../components/common/PageHeader'
import { Loader } from '../components/common/Loader'
import styles from './Settings.module.css'

export default function Settings() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(null)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.getSettings,
  })

  useEffect(() => {
    if (settings) setForm({ ...settings })
  }, [settings])

  const mutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings saved!')
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const handleSave = () => mutation.mutate(form)
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  if (isLoading || !form) return <Loader />

  return (
    <div className={styles.page}>
      <PageHeader
        title="Settings"
        subtitle="Clinic profile, WhatsApp connection and notification preferences"
        icon={SettingsIcon}
        actions={<Button icon={Save} onClick={handleSave} disabled={mutation.isPending}>Save Settings</Button>}
      />
      {/* Clinic Info */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Clinic Information</h3>
        <div className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Clinic Name</label>
              <input className={styles.formInput} value={form.clinic_name}
                onChange={(e) => update('clinic_name', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phone</label>
              <input className={styles.formInput} value={form.clinic_phone}
                onChange={(e) => update('clinic_phone', e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Address</label>
            <input className={styles.formInput} value={form.clinic_address}
              onChange={(e) => update('clinic_address', e.target.value)} />
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>WhatsApp Configuration</h3>
        <div className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>WhatsApp Business Number</label>
              <input className={styles.formInput} value={form.whatsapp_number}
                onChange={(e) => update('whatsapp_number', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>API Status</label>
              <div className={styles.statusDot}>
                <span className={styles.dot} style={{
                  background: form.whatsapp_api_status === 'connected' ? 'var(--primary)' : 'var(--status-cancelled)'
                }} />
                {form.whatsapp_api_status === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Notifications</h3>
        {[
          { key: 'notification_booking_confirm', label: 'Booking Confirmation', sub: 'Send WhatsApp message when booking is confirmed' },
          { key: 'notification_booking_reminder', label: 'Booking Reminder', sub: 'Send reminder before appointment' },
          { key: 'notification_booking_cancel', label: 'Cancellation Alert', sub: 'Notify when booking is cancelled' },
        ].map((item) => (
          <div key={item.key} className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>{item.label}</div>
              <div className={styles.toggleSub}>{item.sub}</div>
            </div>
            <button
              className={`${styles.toggle} ${form[item.key] ? styles.active : ''}`}
              onClick={() => update(item.key, !form[item.key])}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
