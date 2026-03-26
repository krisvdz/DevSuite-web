// ═══════════════════════════════════════════════════════════════════════════
// AUTH CONTEXT — Estado global de autenticação
// ═══════════════════════════════════════════════════════════════════════════
//
// 📚 CONCEITO: Context API vs Redux vs Zustand
//
// Para gerenciar estado GLOBAL (acessível em qualquer componente), temos opções:
//
// Context API (React nativo):
//   + Sem dependência extra
//   + Ideal para dados que mudam pouco (tema, autenticação, idioma)
//   - Re-renderiza todos os consumidores quando o valor muda
//
// Redux Toolkit:
//   + Padrão em grandes aplicações, excelente DevTools
//   - Mais verboso, curva de aprendizado
//
// Zustand:
//   + Simples, pequeno, ótima performance
//   + Muito popular atualmente
//   - Terceira dependência
//
// Para autenticação (poucos updates), Context API é perfeito.
// Para dados do servidor (listas, etc.), use React Query — não Context!
//
// 📚 CONCEITO: Onde guardar o token JWT?
//
// Opções:
// 1. localStorage: persistente, fácil, mas vulnerável a XSS
// 2. sessionStorage: dura só a sessão, menos persistente
// 3. Cookie httpOnly: mais seguro (JS não acessa), mas precisa de backend
//
// Para este projeto: localStorage (comum em SPAs, ok se o XSS for prevenido)

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

// 1. Cria o Context com valor padrão undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 2. Provider — envolve a aplicação e fornece o estado
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // inicia true para checar token salvo

  // Ao carregar a app: verifica se há token salvo no localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('taskflow:token')
    const savedUser = localStorage.getItem('taskflow:user')

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password })
    // Salva no estado e no localStorage
    setUser(data.user as User)
    setToken(data.token)
    localStorage.setItem('taskflow:token', data.token)
    localStorage.setItem('taskflow:user', JSON.stringify(data.user))
    toast.success(`Bem-vindo, ${data.user.name}!`)
  }

  const register = async (name: string, email: string, password: string) => {
    const { data } = await authApi.register({ name, email, password })
    setUser(data.user as User)
    setToken(data.token)
    localStorage.setItem('taskflow:token', data.token)
    localStorage.setItem('taskflow:user', JSON.stringify(data.user))
    toast.success('Conta criada com sucesso!')
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('taskflow:token')
    localStorage.removeItem('taskflow:user')
    toast.success('Logout realizado')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 3. Hook customizado — encapsula o useContext com verificação de erro
// 📚 CONCEITO: Custom Hooks
// Hooks customizados são funções que começam com "use" e podem chamar outros hooks.
// Eles encapsulam lógica reutilizável — como componentes, mas para lógica.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
