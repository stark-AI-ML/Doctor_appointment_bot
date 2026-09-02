import { useQuery } from '@tanstack/react-query'
import {
  CalendarCheck,
  CalendarPlus,
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
import StatusBadge from '../components/common/StatusBadge'
import Button from '../components/common/Button'
import { Loader } from '../components/common/Loader'
import styles from './Dashboard.module.css'

const PIE_COLORS = ['#25D366', '#f0ad4e', '#58a6ff', '#f85149']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1a2233',
      border: '1px solid #21262d',
      borderRadius: '10px',
      padding: '12px 16px',
      fontSize: '13px',
    }}>
      <p style={{ color: '#8b949e', marginBottom: '4px' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
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
      label: 'Total Bookings',
      value: stats?.totalBookings ?? 0,
      icon: CalendarCheck,
      color: 'green',
      change: '+12%',
      positive: true,
    },
    {
      label: "Today's Bookings",
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
                      <stop offset="0%" stopColor="#25D366" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#25D366" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientConfirmed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#58a6ff" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#58a6ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="date" stroke="#484f58" fontSize={12} />
                  <YAxis stroke="#484f58" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="#25D366"
                    strokeWidth={2}
                    fill="url(#gradientBookings)"
                    name="Bookings"
                  />
                  <Area
                    type="monotone"
                    dataKey="confirmed"
                    stroke="#58a6ff"
                    strokeWidth={2}
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
                    <span style={{ color: '#8b949e', fontSize: '12px' }}>{value}</span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a2233',
                    border: '1px solid #21262d',
                    borderRadius: '10px',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <div className={styles.quickActions}>
        <Link to="/bookings">
          <Button icon={Eye}>View All Bookings</Button>
        </Link>
        <Link to="/doctors">
          <Button variant="secondary" icon={Plus}>Add Doctor</Button>
        </Link>
        <Link to="/time-slots">
          <Button variant="secondary" icon={CalendarPlus}>Manage Slots</Button>
        </Link>
      </div>

      {/* ── Recent Bookings ── */}
      <Card
        title="Recent Bookings"
        action={
          <Link to="/bookings">
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
                  <th style={thStyle}>Booking ID</th>
                  <th style={thStyle}>Patient</th>
                  <th style={thStyle}>Doctor</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Time</th>
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
                    <td style={tdStyle}>{booking.time_slot}</td>
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
