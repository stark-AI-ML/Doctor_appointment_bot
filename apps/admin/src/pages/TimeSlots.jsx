import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { timeSlotService } from '../services/timeSlotService'
import { doctorService } from '../services/doctorService'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Loader } from '../components/common/Loader'
import styles from './TimeSlots.module.css'

export default function TimeSlots() {
  const queryClient = useQueryClient()
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [newTime, setNewTime] = useState('')

  const { data: doctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: doctorService.getDoctors,
  })

  const { data: slots, isLoading } = useQuery({
    queryKey: ['timeslots', selectedDoctor],
    queryFn: () => timeSlotService.getSlots(selectedDoctor),
    enabled: !!selectedDoctor,
  })

  const createMutation = useMutation({
    mutationFn: timeSlotService.createSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeslots'] })
      toast.success('Slot added!')
      setNewTime('')
    },
    onError: () => toast.error('Failed to add slot'),
  })

  const deleteMutation = useMutation({
    mutationFn: timeSlotService.deleteSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeslots'] })
      toast.success('Slot removed')
    },
  })

  const handleAddSlot = (e) => {
    e.preventDefault()
    if (!newTime || !selectedDoctor) return
    // Convert 24h to 12h format
    const [h, m] = newTime.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    const timeStr = `${String(hour12).padStart(2, '0')}:${m} ${ampm}`
    
    createMutation.mutate({
      doctor_id: Number(selectedDoctor),
      time: timeStr,
    })
  }

  const activeDoctors = doctors?.filter((d) => d.is_active) || []
  const availableSlots = slots?.filter((s) => !s.is_booked).length || 0
  const bookedSlots = slots?.filter((s) => s.is_booked).length || 0

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <select
            className={styles.select}
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            id="doctor-select"
          >
            <option value="">Select a doctor</option>
            {activeDoctors.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
          {selectedDoctor && (
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: 'var(--primary)' }} />
                Available ({availableSlots})
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: 'var(--status-cancelled)' }} />
                Booked ({bookedSlots})
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedDoctor && (
        <Card title="Add Time Slot">
          <form className={styles.addForm} onSubmit={handleAddSlot}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Time</label>
              <input
                type="time"
                className={styles.timeInput}
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
              />
            </div>
            <Button type="submit" icon={Plus} disabled={!newTime}>
              Add Slot
            </Button>
          </form>
        </Card>
      )}

      <Card title="Time Slots" noPadding={!selectedDoctor}>
        {!selectedDoctor ? (
          <div className={styles.emptyState}>
            <Clock size={48} className={styles.emptyIcon} />
            <p>Select a doctor to manage their time slots</p>
          </div>
        ) : isLoading ? (
          <Loader />
        ) : slots?.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock size={48} className={styles.emptyIcon} />
            <p>No time slots configured. Add one above.</p>
          </div>
        ) : (
          <div className={styles.slotGrid}>
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`${styles.slot} ${slot.is_booked ? styles.booked : styles.available}`}
              >
                <button
                  className={styles.slotDelete}
                  onClick={() => deleteMutation.mutate(slot.id)}
                  title="Remove slot"
                >
                  <X size={14} />
                </button>
                <span className={`${styles.slotStatus} ${slot.is_booked ? styles.booked : styles.available}`} />
                {slot.time}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
