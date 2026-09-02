import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { reportService } from '../services/reportService'
import { formatCurrency } from '../utils/formatters'
import Card from '../components/common/Card'
import { Loader } from '../components/common/Loader'
import styles from './Reports.module.css'

const PIE_COLORS = ['#25D366', '#f0ad4e', '#58a6ff', '#f85149']

const tooltipStyle = {
  background: '#1a2233', border: '1px solid #21262d',
  borderRadius: '10px', fontSize: '13px',
}

export default function Reports() {
  const { data: trends, isLoading: tLoading } = useQuery({
    queryKey: ['report-trends'],
    queryFn: () => reportService.getBookingTrends(),
  })

  const { data: doctorStats, isLoading: dLoading } = useQuery({
    queryKey: ['report-doctors'],
    queryFn: reportService.getDoctorStats,
  })

  const { data: statusDist } = useQuery({
    queryKey: ['report-status'],
    queryFn: reportService.getStatusDistribution,
  })

  const { data: revenue } = useQuery({
    queryKey: ['report-revenue'],
    queryFn: () => reportService.getRevenue(),
  })

  if (tLoading || dLoading) return <Loader />

  return (
    <div className={styles.page}>
      {/* Summary */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>{formatCurrency(revenue?.total || 0)}</div>
          <div className={styles.summaryLabel}>Total Revenue</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>{formatCurrency(revenue?.average_per_day || 0)}</div>
          <div className={styles.summaryLabel}>Avg per Day</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue} style={{ color: 'var(--primary)' }}>
            +{revenue?.growth || 0}%
          </div>
          <div className={styles.summaryLabel}>Growth</div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <Card title="Booking Trends">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#25D366" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="date" stroke="#484f58" fontSize={12} />
                <YAxis stroke="#484f58" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="bookings" stroke="#25D366" strokeWidth={2} fill="url(#gBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Doctor-wise Bookings">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="doctor" stroke="#484f58" fontSize={11} />
                <YAxis stroke="#484f58" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="bookings" fill="#58a6ff" radius={[6, 6, 0, 0]} />
                <Bar dataKey="revenue" fill="#bc8cff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className={styles.chartsGrid}>
        <Card title="Status Distribution">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDist || []} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {(statusDist || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                  formatter={(v) => <span style={{ color: '#8b949e', fontSize: '12px' }}>{v}</span>} />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Doctor Performance">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  {['Doctor', 'Bookings', 'Revenue', 'Completion %'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doctorStats?.map((d) => (
                  <tr key={d.doctor} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{d.doctor}</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{d.bookings}</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{formatCurrency(d.revenue)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px', color: 'var(--primary)' }}>{d.completion_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
