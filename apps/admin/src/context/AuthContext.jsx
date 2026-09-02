import { createContext, useReducer, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

export const AuthContext = createContext(null)

const initialState = {
  user: null,
  token: localStorage.getItem('docbot_token') || null,
  isAuthenticated: false,
  isLoading: true,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADED':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check if user is logged in on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('docbot_token')
      if (!token) {
        dispatch({ type: 'AUTH_ERROR' })
        return
      }
      try {
        const user = await authService.getMe()
        dispatch({ type: 'AUTH_LOADED', payload: user })
      } catch {
        localStorage.removeItem('docbot_token')
        localStorage.removeItem('docbot_user')
        dispatch({ type: 'AUTH_ERROR' })
      }
    }
    loadUser()
  }, [])

  const login = useCallback(async (email, password) => {
    const { user, token } = await authService.login(email, password)
    localStorage.setItem('docbot_token', token)
    localStorage.setItem('docbot_user', JSON.stringify(user))
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } })
    return user
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    localStorage.removeItem('docbot_token')
    localStorage.removeItem('docbot_user')
    dispatch({ type: 'LOGOUT' })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
