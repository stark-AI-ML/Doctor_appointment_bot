import styles from './FormField.module.css'

/**
 * FormField — consistent labelled control with bilingual hint + inline error.
 * @param {string} label
 * @param {string} hint - Secondary hint, e.g. Hindi label
 * @param {boolean} required
 * @param {string} error - Error text shown under the control
 */
export default function FormField({ label, hint, required, error, children, htmlFor }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
        {required && <span className={styles.required} aria-hidden> *</span>}
        {hint && <span className={styles.hint}> · {hint}</span>}
      </label>
      <div className={`${styles.control} ${error ? styles.hasError : ''}`}>{children}</div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
