import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectPage } from './pages/ProjectPage'
import { LandingPage } from './pages/LandingPage'
import { DevPulsePage } from './pages/DevPulsePage'
import { FocusTimerPage } from './pages/FocusTimerPage'
import { AppLayout } from './components/layout/AppLayout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true, staleTime: 1000 * 30 },
    mutations: { retry: 0 },
  },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/app/tasks" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* App routes — all use AppLayout sidebar */}
      <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/app/tasks" replace />} />
        <Route path="tasks" element={<DashboardPage />} />
        <Route path="tasks/:id" element={<ProjectPage />} />
        <Route path="devpulse" element={<DevPulsePage />} />
        <Route path="focus" element={<FocusTimerPage />} />
      </Route>

      {/* Legacy redirect */}
      <Route path="/dashboard" element={<Navigate to="/app/tasks" replace />} />
      <Route path="/projects/:id" element={<Navigate to="/app/tasks" replace />} />

      <Route path="*" element={
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-white">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-600 mb-4">404</h1>
            <p className="text-gray-500">Página não encontrada</p>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { background: '#1e1b4b', color: '#f9fafb', fontSize: '14px', border: '1px solid rgba(139,92,246,0.3)' },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
