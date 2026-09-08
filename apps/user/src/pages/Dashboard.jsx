import { useQuery } from '@tanstack/react-query'
import {
  CalendarCheck,
  CalendarPlus,
  LayoutDashboard,
  Stethoscope,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Plus,
  ArrowUpRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Link } from 'react-router-dom'
import { dashboardService } from '../services/dashboardService'
import { formatDate, formatCurrency, getInitials } from '../utils/formatters'
import Card from '../components/common/Card'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import Button from '../components/common/Button'
import { Loader } from '../components/common/Loader'
import styles from './Dashboard.module.css'

const PIE_COLORS = ['#10b981', '#f59e0b', '#0284c7', '#ef4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '12px 16px',
      fontSize: '13px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    }}>
      <p style={{ color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: '3px 0' }}>
          {entry.name}: <strong style={{ color: '#0f172a' }}>{entry.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  })

  const { data: recentBookings, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => dashboardService.getRecentBookings(5),
  })

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: () => dashboardService.getChartData('7d'),
  })

  const statCards = [
    {
      label: 'Total Appointments',
      value: stats?.totalBookings ?? 0,
      icon: CalendarCheck,
      color: 'green',
      change: '+12%',
      positive: true,
    },
    {
      label: "Today's Queue",
      value: stats?.todayBookings ?? 0,
      icon: CalendarPlus,
      color: 'blue',
      change: '+5%',
      positive: true,
    },
    {
      label: 'Confirmed',
      value: stats?.confirmed ?? 0,
      icon: Stethoscope,
      color: 'green',
      change: '+8%',
      positive: true,
    },
    {
      label: 'Cancelled',
      value: stats?.cancelled ?? 0,
      icon: XCircle,
      color: 'orange',
      change: '-3%',
      positive: false,
    },
  ]

  const pieData = [
    { name: 'Confirmed', value: stats?.confirmed ?? 0 },
    { name: 'Pending', value: (stats?.todayBookings ?? 0) - (stats?.confirmed ?? 0) + 5 },
    { name: 'Completed', value: Math.floor((stats?.confirmed ?? 0) * 0.3) },
    { name: 'Cancelled', value: stats?.cancelled ?? 0 },
  ].filter((d) => d.value > 0)

  if (statsLoading) return <Loader />

  return (
    <div className={styles.dashboard}>
      <PageHeader
        title="Dashboard"
        subtitle="Today at KG Nanda Hospital · bookings, doctors and patients at a glance"
        icon={LayoutDashboard}
      />
      {/* ── Stat Cards ── */}
      <div className={styles.statsGrid}>
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={styles.statCard}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>{stat.label}</span>
                <div className={`${styles.statIcon} ${styles[stat.color]}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={`${styles.statChange} ${stat.positive ? styles.positive : styles.negative}`}>
                {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stat.change} from last week
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Charts ── */}
      <div className={styles.chartsRow}>
        <Card title="Booking Trends" subtitle="Last 7 days">
          <div className={styles.chartContainer}>
            {chartLoading ? (
              <Loader />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradientConfirmed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#gradientBookings)"
                    name="Bookings"
                  />
                  <Area
                    type="monotone"
                    dataKey="confirmed"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fill="url(#gradientConfirmed)"
                    name="Confirmed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Status Distribution">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '13px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    color: '#0f172a',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <div className={styles.quickActions}>
        <Link to="/appointments">
          <Button icon={Eye}>View Today's Queue</Button>
        </Link>
        <Link to="/doctors">
          <Button variant="secondary" icon={Plus}>Add Doctor</Button>
        </Link>
        <Link to="/hospitalization">
          <Button variant="secondary" icon={CalendarPlus}>Hospitalization</Button>
        </Link>
      </div>

      {/* ── Recent Bookings ── */}
      <Card
        title="Recent Appointments"
        action={
          <Link to="/appointments">
            <Button variant="ghost" size="sm" icon={ArrowUpRight}>
              View All
            </Button>
          </Link>
        }
        noPadding
      >
        {recentLoading ? (
          <Loader />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.recentTable} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Patient</th>
                  <th style={thStyle}>Doctor</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Token</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings?.map((booking) => (
                  <tr key={booking.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td style={tdStyle}>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 500, fontSize: '13px' }}>
                        {booking.booking_id}
                      </span>
                    </td>
                    <td style={tdStyle}>{booking.patient_name}</td>
                    <td style={tdStyle}>
                      <div className={styles.doctorCell}>
                        <div className={styles.doctorAvatar}>
                          {getInitials(booking.doctor_name)}
                        </div>
                        {booking.doctor_name}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span className={styles.mobileText}>{formatDate(booking.date)}</span>
                    </td>
                    <td style={tdStyle}>{booking.token_number || booking.time_slot || '-'}</td>
                    <td style={tdStyle}><StatusBadge status={booking.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '12px 16px',
  fontSize: '14px',
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
}
