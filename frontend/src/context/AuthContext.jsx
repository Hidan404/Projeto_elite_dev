import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then((r) => {
        setUser({ email: r.data.email, role: r.data.role })
        localStorage.setItem('user', JSON.stringify({ email: r.data.email, role: r.data.role }))
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem('user')
      })
      .finally(() => setCarregando(false))
  }, [])

  const login = async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha })
    localStorage.setItem('user', JSON.stringify({ email, role: data.role }))
    setUser({ email, role: data.role })
    return data
  }

  const register = async (nome, email, senha) => {
    await api.post('/auth/register', { nome, email, senha })
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, carregando, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}