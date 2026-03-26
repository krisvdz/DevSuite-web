// ═══════════════════════════════════════════════════════════════════════════
// APP.TSX — Roteamento e providers globais
// ═══════════════════════════════════════════════════════════════════════════
//
// 📚 CONCEITO: React Router v6
//
// React Router gerencia a navegação em SPAs sem recarregar a página.
// Ele "intercepta" o clique em links e atualiza apenas o que mudou.
//
// BrowserRouter: usa a History API do browser (URLs limpas: /dashboard)
// HashRouter: usa # nas URLs (/dashboard → /#/dashboard) — não precisa config no servidor
//
// 📚 CONCEITO: Protected Routes
//
// Rotas protegidas verificam se o usuário está autenticado antes de renderizar.
// Se não estiver, redireciona para /login.
// Evita que usuários acessem páginas privadas sem estar logados.
//
// 📚 CONCEITO: Provider Pattern
//
// Providers envolvem a árvore de componentes e injetam dados/configurações.
// A ordem importa: providers internos podem acessar dados dos externos.
//
// QueryClientProvider (React Query) > AuthProvider (nosso) > Router > App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectPage } from './pages/ProjectPage'

// Configura o cliente do React Query
// 📚 Configurações globais que se aplicam a todas as queries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tenta novamente 1 vez em caso de erro (padrão: 3 — muito para dev)
      retry: 1,
      // Revalida ao focar a janela (útil: dados sempre frescos ao voltar pra aba)
      refetchOnWindowFocus: true,
      // Dados são considerados "frescos" por 30 segundos
      staleTime: 1000 * 30,
    },
    mutations: {
      retry: 0, // Não tenta novamente em mutations (efeitos colaterais!)
    },
  },
})

// ─── Componente de Rota Protegida ─────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  // Enquanto verifica o token salvo, mostra loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Se não autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// ─── Componente de Rota Pública ───────────────────────────────────────────────
// (redireciona usuário autenticado para dashboard)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// ─── App ─────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Redireciona / para /dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Rotas públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Rotas privadas */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <PrivateRoute>
            <ProjectPage />
          </PrivateRoute>
        }
      />

      {/* 404 — rota curinga */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
              <p className="text-gray-500">Página não encontrada</p>
            </div>
          </div>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    // Providers aninhados — cada um injeta dados na árvore abaixo
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          {/* Toast notifications globais */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                fontSize: '14px',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
      {/* DevTools do React Query — visível apenas em desenvolvimento */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
