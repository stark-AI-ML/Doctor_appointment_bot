import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { homeForRole } from '../App'
import { mockUsers, mockUserPasswords } from '../data/mockData'
import styles from './Login.module.css'

const DEMO_ACCOUNTS = [
  { role: 'superadmin', email: 'super@kgnanda.com' },
  { role: 'admin', email: 'admin@docbot.com' },
  { role: 'doctor', email: 'doctor@kgnanda.com' },
  { role: 'receptionist', email: 'reception@kgnanda.com' },
  { role: 'pharmacy', email: 'pharmacy@kgnanda.com' },
]

export default function Login() {
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in — to the role home
  if (isAuthenticated) {
    navigate(homeForRole(user?.role), { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loggedIn = await login(email, password)
      navigate(homeForRole(loggedIn?.role), { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail)
    setPassword(mockUserPasswords[demoEmail] || '')
    setError('')
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <MessageCircle />
          </div>
          <h1 className={styles.brandName}>KG Nanda Hospital</h1>
          <p className={styles.brandSub}>Dashboard — WhatsApp Booking Management</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className={styles.formInput}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@kgnanda.com"
              required
              autoFocus
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className={styles.formInput}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !email || !password}
            id="login-submit"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.hint}>
          <p style={{ margin: '0 0 8px' }}><strong>Demo logins</strong> (click to fill):</p>
          {DEMO_ACCOUNTS.map((a) => {
            const u = mockUsers.find((x) => x.email === a.email)
            return (
              <button
                key={a.email}
                type="button"
                onClick={() => fillDemo(a.email)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 0', fontSize: '12px', color: 'var(--text-secondary)',
                }}
              >
                <code>{u?.staffCode}</code> · {a.role} — <code>{a.email}</code> / <code>{mockUserPasswords[a.email]}</code>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
