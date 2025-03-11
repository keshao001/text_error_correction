'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

type User = {
  id: string
  email: string
} | null

type AuthContextType = {
  user: User
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const defaultContext: AuthContextType = {
  user: null,
  isLoading: true,
  login: async () => {
    throw new Error('AuthContext not initialized')
  },
  signup: async () => {
    throw new Error('AuthContext not initialized')
  },
  logout: async () => {
    throw new Error('AuthContext not initialized')
  },
}

const AuthContext = createContext<AuthContextType>(defaultContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkSession().finally(() => {
      setIsLoading(false)
    })
  }, [])

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (!res.ok) {
        setUser(null)
        return
      }
      const session = await res.json()
      if (session?.user) {
        setUser({
          id: session.user.userId,
          email: session.user.email,
        })
      } else {
        setUser(null)
      }
    } catch (error) {
      console.log('Session check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Login failed')
      }

      const { user } = await res.json()
      setUser(user)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const signup = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Signup failed')
      }

      const { user } = await res.json()
      setUser(user)
    } catch (error) {
      console.error('Signup failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      await checkSession() // This will set the user to default user if available
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
