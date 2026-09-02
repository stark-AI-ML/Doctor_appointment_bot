import { STATUS_COLORS } from '../../utils/constants'
import styles from './StatusBadge.module.css'

/**
 * Color-coded status badge for booking statuses
 */
export default function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { text: '#8b949e', bg: 'rgba(139, 148, 158, 0.12)' }

  return (
    <span
      className={styles.badge}
      style={{ background: colors.bg, color: colors.text }}
    >
      <span className={styles.dot} style={{ background: colors.text }} />
      {status}
    </span>
  )
}
