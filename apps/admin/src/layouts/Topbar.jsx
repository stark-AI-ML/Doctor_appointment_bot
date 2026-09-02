import { useLocation } from 'react-router-dom'
import { Menu, Search, Bell, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getInitials } from '../utils/formatters'
import styles from './Topbar.module.css'

const pageTitles = {
  '/': 'Dashboard',
  '/bookings': 'Bookings',
  '/doctors': 'Doctors',
  '/time-slots': 'Time Slots',
  '/patients': 'Patients',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

export default function Topbar({ collapsed, onToggleCollapse, onToggleMobile }) {
  const { user } = useAuth()
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Dashboard'

  return (
    <header
      className={`${styles.topbar} ${collapsed ? styles.collapsed : styles.expanded}`}
    >
      <div className={styles.topbarLeft}>
        {/* Mobile menu */}
        <button
          className={`${styles.menuBtn} ${styles.mobileOnly}`}
          onClick={onToggleMobile}
          id="mobile-menu-btn"
          aria-label="Toggle menu"
          style={{ display: 'none' }}
        >
          <Menu size={20} />
        </button>

        {/* Collapse toggle */}
        <button
          className={styles.menuBtn}
          onClick={onToggleCollapse}
          id="sidebar-toggle-btn"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      <div className={styles.topbarRight}>
        {/* Search */}
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search..."
            id="global-search"
          />
        </div>

        {/* Notifications */}
        <button className={styles.iconBtn} id="notifications-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.notifDot} />
        </button>

        {/* User Avatar */}
        <div className={styles.avatar} id="user-avatar">
          <div className={styles.avatarCircle}>
            {getInitials(user?.name || 'Admin')}
          </div>
          <div className={styles.avatarInfo}>
            <span className={styles.avatarName}>{user?.name || 'Admin'}</span>
            <span className={styles.avatarRole}>{user?.role || 'admin'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
