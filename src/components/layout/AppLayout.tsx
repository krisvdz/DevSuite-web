import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Github, Timer, LogOut, Zap, ChevronRight
} from 'lucide-react'

const navItems = [
  {
    to: '/app/tasks',
    icon: LayoutDashboard,
    label: 'TaskFlow',
    description: 'Projetos e tarefas',
    color: 'text-violet-400',
    activeBg: 'bg-violet-500/10 border-violet-500/30',
  },
  {
    to: '/app/devpulse',
    icon: Github,
    label: 'Dev Pulse',
    description: 'GitHub trending',
    color: 'text-blue-400',
    activeBg: 'bg-blue-500/10 border-blue-500/30',
  },
  {
    to: '/app/focus',
    icon: Timer,
    label: 'Focus Timer',
    description: 'Sessões pomodoro',
    color: 'text-emerald-400',
    activeBg: 'bg-emerald-500/10 border-emerald-500/30',
  },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#0d1425] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white group-hover:text-violet-300 transition-colors">DevSuite</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 px-3">Ferramentas</p>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app/tasks'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all group ${
                    isActive
                      ? `${item.activeBg} border-opacity-50`
                      : 'border-transparent hover:bg-white/5 hover:border-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-300'} transition-colors`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'} transition-colors`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{item.description}</p>
                    </div>
                    {isActive && <ChevronRight className={`h-3 w-3 ${item.color} flex-shrink-0`} />}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
