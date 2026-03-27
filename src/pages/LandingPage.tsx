import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Github, Timer, ArrowRight, Zap, Star } from 'lucide-react'

const features = [
  {
    icon: LayoutDashboard,
    title: 'TaskFlow',
    subtitle: 'Gerenciador de Projetos',
    description: 'Organize seus projetos com um board Kanban visual. Crie tarefas, mude status com drag-and-drop e acompanhe o progresso em tempo real.',
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/25',
    border: 'border-violet-500/20',
    mockup: (
      <div className="space-y-2 p-4">
        <div className="flex gap-2">
          {['A Fazer', 'Em Progresso', 'Concluído'].map((col, i) => (
            <div key={col} className="flex-1 bg-white/5 rounded-lg p-2">
              <p className="text-xs text-gray-500 mb-2 font-medium">{col}</p>
              {[0, 1].map((j) => (
                <div key={j} className={`h-7 rounded-md mb-1.5 ${i === 0 ? 'bg-violet-500/20' : i === 1 ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    path: '/app/tasks',
  },
  {
    icon: Github,
    title: 'Dev Pulse',
    subtitle: 'GitHub Trending',
    description: 'Descubra os projetos open-source mais quentes do momento. Filtre por linguagem, veja stars, forks e descrições direto do GitHub.',
    color: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/25',
    border: 'border-blue-500/20',
    mockup: (
      <div className="space-y-2 p-4">
        {[
          { name: 'shadcn/ui', stars: '62.4k', lang: 'TypeScript' },
          { name: 'vercel/next.js', stars: '121k', lang: 'JavaScript' },
          { name: 'microsoft/vscode', stars: '160k', lang: 'TypeScript' },
        ].map((repo) => (
          <div key={repo.name} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-300 font-mono">{repo.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <Star className="h-2.5 w-2.5 fill-current" />{repo.stars}
              </span>
              <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 rounded">{repo.lang}</span>
            </div>
          </div>
        ))}
      </div>
    ),
    path: '/app/devpulse',
  },
  {
    icon: Timer,
    title: 'Focus Timer',
    subtitle: 'Pomodoro Tracker',
    description: 'Maximize sua produtividade com sessões Pomodoro cronometradas. Histórico de sessões, estatísticas semanais e gráfico de progresso.',
    color: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/25',
    border: 'border-emerald-500/20',
    mockup: (
      <div className="flex flex-col items-center justify-center py-4 px-4">
        <div className="relative w-20 h-20 mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#grad)" strokeWidth="8"
              strokeDasharray="264" strokeDashoffset="66" strokeLinecap="round" />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-lg">18:45</span>
          </div>
        </div>
        <div className="flex gap-3 text-center">
          <div><p className="text-emerald-400 font-bold text-sm">4</p><p className="text-xs text-gray-500">Sessões</p></div>
          <div><p className="text-emerald-400 font-bold text-sm">100</p><p className="text-xs text-gray-500">Minutos</p></div>
          <div><p className="text-emerald-400 font-bold text-sm">7d</p><p className="text-xs text-gray-500">Streak</p></div>
        </div>
      </div>
    ),
    path: '/app/focus',
  },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40 pointer-events-none" />

      {/* Glow orbs */}
      <div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-200px] left-1/2 w-[600px] h-[400px] rounded-full bg-emerald-600/8 blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg">DevSuite</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 rounded-lg font-medium transition-all shadow-lg shadow-violet-500/25"
          >
            Começar grátis
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Produtividade para desenvolvedores
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
          Suas ferramentas de<br />
          <span className="gradient-text">dev em um só lugar</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Gerencie projetos, explore o que está trending no GitHub e
          mantenha o foco com sessões Pomodoro — tudo integrado.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105"
          >
            Começar agora
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all"
          >
            Já tenho conta
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-16 pt-16 border-t border-white/5">
          {[
            { value: '3', label: 'Ferramentas integradas' },
            { value: '100%', label: 'Open source stack' },
            { value: 'Zero', label: 'Ads ou rastreamento' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-black gradient-text mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Tudo que você precisa para <span className="gradient-text">codar melhor</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Três ferramentas pensadas para o fluxo de trabalho de quem desenvolve software.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className={`relative group rounded-2xl border ${feature.border} bg-white/3 overflow-hidden hover:bg-white/5 transition-all cursor-pointer hover:-translate-y-1`}
                onClick={() => navigate('/register')}
              >
                {/* Gradient top border */}
                <div className={`h-px bg-gradient-to-r ${feature.color} opacity-60`} />

                <div className="p-6">
                  {/* Icon */}
                  <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg ${feature.glow} mb-4`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{feature.subtitle}</p>
                  <p className="text-sm text-gray-400 leading-relaxed mb-4">{feature.description}</p>

                  {/* Mockup */}
                  <div className="rounded-xl bg-black/30 border border-white/5 overflow-hidden">
                    {feature.mockup}
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className={`flex items-center gap-1.5 text-sm font-medium bg-gradient-to-r ${feature.color} bg-clip-text text-transparent group-hover:gap-2.5 transition-all`}>
                    Acessar ferramenta <ArrowRight className="h-3.5 w-3.5" style={{ color: 'currentColor' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-400" />
            <span className="text-sm text-gray-500">DevSuite — Feito para devs, por devs.</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>React</span><span>•</span>
            <span>Node.js</span><span>•</span>
            <span>TypeScript</span><span>•</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
