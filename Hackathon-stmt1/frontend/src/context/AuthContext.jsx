import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { api } from '../services/api.js'

const AuthContext = createContext(null)

const TOKEN_KEY = 'ivtp_token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = Boolean(token)

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      try {
        if (!token) return
        const { data } = await api.get('/api/auth/me')
        if (isMounted) setUser(data.user)
      } catch (err) {
        localStorage.removeItem(TOKEN_KEY)
        if (isMounted) {
          setToken(null)
          setUser(null)
        }
      }
    }

    bootstrap().finally(() => {
      if (isMounted) setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [token])

  async function login({ email, password }) {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
    toast.success('Welcome back')
  }

  async function register({ name, email, password, phone }) {
    const { data } = await api.post('/api/auth/register', { name, email, password, phone })
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
    toast.success('Account created')
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    toast.success('Signed out')
  }

  const value = useMemo(
    () => ({
      token,
      user,
      setUser,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
    }),
    [token, user, isLoading, isAuthenticated]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

