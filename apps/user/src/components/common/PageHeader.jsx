import styles from './PageHeader.module.css'

/**
 * PageHeader — consistent title block for every page.
 * @param {string} title
 * @param {string} subtitle
 * @param {React.ComponentType} icon - Lucide icon shown in the gradient bubble
 * @param {React.ReactNode} actions - Buttons/counts on the right
 */
export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className={`${styles.header} animate-fade-in`}>
      <div className={styles.titleWrap}>
        {Icon && (
          <div className={styles.iconBubble}>
            <Icon size={20} />
          </div>
        )}
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
