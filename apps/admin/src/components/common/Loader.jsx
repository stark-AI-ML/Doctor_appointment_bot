import styles from './Loader.module.css'

/**
 * Spinner loader
 */
export function Loader({ small = false }) {
  return (
    <div className={`${styles.loader} ${small ? styles.loaderSm : ''}`}>
      <div className={styles.spinner} />
    </div>
  )
}

/**
 * Skeleton loader for content placeholders
 */
export function Skeleton({ width, height, circle = false, style = {} }) {
  return (
    <div
      className={`${styles.skeleton} ${circle ? styles.skeletonCircle : styles.skeletonLine}`}
      style={{ width, height, ...style }}
    />
  )
}
