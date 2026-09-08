import { STATUS_COLORS } from '../../utils/constants'
import styles from './StatusBadge.module.css'

/**
 * Color-coded status badge for booking statuses
 */
export default function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase()
  const colors = STATUS_COLORS[key] || { text: '#8b949e', bg: 'rgba(139, 148, 158, 0.12)' }
  const label = status ? String(status).charAt(0).toUpperCase() + String(status).slice(1) : '—'

  return (
    <span
      className={styles.badge}
      style={{ background: colors.bg, color: colors.text }}
    >
      <span className={styles.dot} style={{ background: colors.text }} />
      {label}
    </span>
  )
}
