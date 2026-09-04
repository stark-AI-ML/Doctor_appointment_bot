import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarCheck,
  Stethoscope,
  Bed,
  Pill,
  Users,
  BarChart3,
  Settings,
  LogOut,
  MessageCircle,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import styles from './Sidebar.module.css'

const iconMap = {
  LayoutDashboard,
  CalendarCheck,
  Stethoscope,
  Bed,
  Pill,
  Users,
  BarChart3,
  Settings,
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/appointments', label: 'Appointments', icon: 'CalendarCheck' },
  { path: '/hospitalization', label: 'Hospitalization', icon: 'Bed' },
  { path: '/medicine-orders', label: 'Medicine Orders', icon: 'Pill' },
  { path: '/doctors', label: 'Doctors', icon: 'Stethoscope' },
  { path: '/patients', label: 'Patients', icon: 'Users' },
  { path: '/reports', label: 'Reports', icon: 'BarChart3' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
]

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const { logout } = useAuth()
  const location = useLocation()

  const sidebarClass = [
    styles.sidebar,
    collapsed ? styles.collapsed : '',
    mobileOpen ? styles.mobileOpen : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div
        className={`${styles.overlay} ${mobileOpen ? styles.visible : ''}`}
        onClick={onCloseMobile}
      />
      <aside className={sidebarClass}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <MessageCircle />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>DocBot</span>
            <span className={styles.brandSub}>Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = iconMap[item.icon]
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={logout} title="Logout">
            <LogOut className={styles.navIcon} />
            <span className={styles.logoutLabel}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
