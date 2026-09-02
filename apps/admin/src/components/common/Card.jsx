import styles from './Card.module.css'

/**
 * Reusable Card component with optional header
 * @param {boolean} hoverable - Adds hover lift effect
 * @param {boolean} glass - Glassmorphism effect
 * @param {boolean} noPadding - Remove padding (for tables)
 * @param {string} title - Optional card title
 * @param {React.ReactNode} action - Optional action in header
 */
export default function Card({
  children,
  title,
  subtitle,
  action,
  hoverable = false,
  glass = false,
  noPadding = false,
  className = '',
  style,
  ...props
}) {
  const classes = [
    styles.card,
    hoverable ? styles.hoverable : '',
    glass ? styles.glass : '',
    noPadding ? styles.noPadding : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} style={style} {...props}>
      {(title || action) && (
        <div className={styles.header}>
          <div>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
