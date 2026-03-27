import { useState, useEffect, useRef, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Play, Pause, RotateCcw, Coffee, Brain, Timer, Flame, Clock, BarChart3, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../services/api'

// ─────────────────────────────────────────────────────────────────────────────
// 📚 CONCEITO: Timers resilientes a troca de abas
//
// O browser THROTTLE (reduz a frequência) de setInterval quando a aba está
// em background — às vezes para 1x por segundo, às vezes 1x por minuto!
//
// Solução: em vez de decrementar (-1 a cada tick), armazenamos um "deadline"
// absoluto: deadline = Date.now() + timeLeft * 1000
//
// A cada tick calculamos: remaining = Math.round((deadline - Date.now()) / 1000)
//
// Assim, não importa o quanto o browser atrase os ticks — quando a aba
// volca ao foco, o tempo correto é calculado instantaneamente via
// o evento 'visibilitychange'.
//
// Padrão: deadline-based timer + visibilitychange event
// ─────────────────────────────────────────────────────────────────────────────

type TimerMode = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK'

const MODES: Record<TimerMode, { label: string; seconds: number; color: string; bgColor: string; icon: React.ElementType }> = {
  WORK:        { label: 'Foco',        seconds: 25 * 60, color: 'text-emerald-400',  bgColor: 'from-emerald-500 to-teal-500',   icon: Brain },
  SHORT_BREAK: { label: 'Pausa curta', seconds: 5 * 60,  color: 'text-blue-400',     bgColor: 'from-blue-500 to-cyan-500',      icon: Coffee },
  LONG_BREAK:  { label: 'Pausa longa', seconds: 15 * 60, color: 'text-violet-400',   bgColor: 'from-violet-500 to-purple-500',  icon: Coffee },
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function FocusTimerPage() {
  const [mode, setMode] = useState<TimerMode>('WORK')
  const [timeLeft, setTimeLeft] = useState(MODES.WORK.seconds)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [label, setLabel] = useState('')

  // ── Refs para timer deadline-based ──────────────────────────────────────────
  // deadlineRef: timestamp absoluto (ms) em que o timer chega a zero
  // Definido quando o timer inicia/retoma. Nunca decrementamos — calculamos.
  const deadlineRef = useRef<number>(0)

  // isRunningRef: espelho de isRunning acessível dentro de closures/handlers
  // sem precisar de dependências em useEffect (evita re-criação de listeners)
  const isRunningRef = useRef(false)
  isRunningRef.current = isRunning

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const queryClient = useQueryClient()

  const totalSeconds = MODES[mode].seconds
  const progress = (timeLeft / totalSeconds) * 100
  const circumference = 2 * Math.PI * 52

  // Stats from backend
  const { data: stats } = useQuery({
    queryKey: ['focus-stats'],
    queryFn: async () => {
      const res = await api.get<{ data: { todaySessions: number; todayMinutes: number; weeklyMinutes: Record<string, number> } }>('/focus-sessions/stats')
      return res.data.data
    },
  })

  const saveSession = useMutation({
    mutationFn: (data: { duration: number; type: string; label?: string }) =>
      api.post('/focus-sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-stats'] })
    },
  })

  const switchMode = useCallback((newMode: TimerMode) => {
    setIsRunning(false)
    deadlineRef.current = 0
    setMode(newMode)
    setTimeLeft(MODES[newMode].seconds)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const handleComplete = useCallback(() => {
    setIsRunning(false)
    deadlineRef.current = 0
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (mode === 'WORK') {
      const newCount = sessionCount + 1
      setSessionCount(newCount)
      saveSession.mutate({ duration: MODES.WORK.seconds, type: 'WORK', label: label || undefined })
      toast.success(`🎯 Sessão ${newCount} concluída! Hora de descansar.`, { duration: 4000 })
      switchMode(newCount % 4 === 0 ? 'LONG_BREAK' : 'SHORT_BREAK')
    } else {
      toast.success('☕ Pausa concluída! Hora de focar.', { duration: 3000 })
      switchMode('WORK')
    }
  }, [mode, sessionCount, label, saveSession, switchMode])

  // ── Ref estável para handleComplete ─────────────────────────────────────────
  // 📚 CONCEITO: Stable ref pattern
  // handleComplete usa sessionCount que muda, mas não queremos recriar o
  // intervalo toda vez. Solução: ref que sempre aponta para a versão mais
  // recente da função. O interval chama handleCompleteRef.current().
  const handleCompleteRef = useRef(handleComplete)
  handleCompleteRef.current = handleComplete

  // ── Toggle play/pause ────────────────────────────────────────────────────────
  // IMPORTANTE: ao INICIAR, definimos o deadline com base no timeLeft atual.
  // Ao retomar de uma pausa, o deadline é recalculado corretamente.
  function toggleRunning() {
    if (!isRunning) {
      deadlineRef.current = Date.now() + timeLeft * 1000
    }
    setIsRunning((v) => !v)
  }

  // ── Intervalo principal ───────────────────────────────────────────────────────
  // Roda a cada 500ms. Calcula o tempo restante via deadline (não decrementa).
  // Assim, se o browser atrasar os ticks (aba em background), o cálculo
  // com Date.now() sempre retorna o valor correto.
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (!deadlineRef.current) return
        const remaining = Math.round((deadlineRef.current - Date.now()) / 1000)
        if (remaining <= 0) {
          handleCompleteRef.current()
        } else {
          setTimeLeft(remaining)
        }
      }, 500)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning]) // só recria quando isRunning muda — usa refs para o resto

  // ── visibilitychange: correção imediata ao voltar para a aba ─────────────────
  // 📚 CONCEITO: Page Visibility API
  // document.hidden === true: aba oculta (outra aba ativa)
  // document.hidden === false: aba voltou ao foco
  //
  // Quando a aba volta: calculamos imediatamente o tempo real decorrido
  // e corrigimos timeLeft antes do próximo tick do interval.
  useEffect(() => {
    function onVisibilityChange() {
      if (!document.hidden && isRunningRef.current && deadlineRef.current) {
        const remaining = Math.round((deadlineRef.current - Date.now()) / 1000)
        if (remaining <= 0) {
          handleCompleteRef.current()
        } else {
          setTimeLeft(remaining)
        }
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, []) // sem dependências — usa refs, listener criado uma única vez

  // Update tab title
  useEffect(() => {
    document.title = isRunning ? `${formatTime(timeLeft)} — ${MODES[mode].label}` : 'Focus Timer — DevSuite'
    return () => { document.title = 'DevSuite' }
  }, [timeLeft, isRunning, mode])

  const currentMode = MODES[mode]
  const ModeIcon = currentMode.icon
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Weekly chart data
  const weeklyData = stats?.weeklyMinutes ? Object.entries(stats.weeklyMinutes) : []
  const maxMinutes = Math.max(...weeklyData.map(([, v]) => v), 1)
  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="h-5 w-5 text-emerald-400" />
            <h1 className="text-xl font-bold">Focus Timer</h1>
          </div>
          <p className="text-sm text-gray-500">Técnica Pomodoro — 25 min foco, 5 min pausa</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Timer — main */}
          <div className="lg:col-span-3 flex flex-col items-center">
            {/* Mode selector */}
            <div className="flex gap-1.5 bg-white/5 border border-white/8 rounded-xl p-1 mb-10">
              {(Object.keys(MODES) as TimerMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === m
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {MODES[m].label}
                </button>
              ))}
            </div>

            {/* Timer ring */}
            <div className="relative mb-8">
              <svg width="220" height="220" viewBox="0 0 120 120" className="-rotate-90">
                {/* Track */}
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                {/* Progress */}
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="url(#timerGrad)"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                />
                <defs>
                  <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={mode === 'WORK' ? '#10b981' : mode === 'SHORT_BREAK' ? '#3b82f6' : '#8b5cf6'} />
                    <stop offset="100%" stopColor={mode === 'WORK' ? '#14b8a6' : mode === 'SHORT_BREAK' ? '#06b6d4' : '#a78bfa'} />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <ModeIcon className={`h-5 w-5 mb-2 ${currentMode.color}`} />
                <span className="text-4xl font-black tabular-nums tracking-tight">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-sm text-gray-500 mt-1">{currentMode.label}</span>
              </div>
            </div>

            {/* Label input */}
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Em que você está trabalhando? (opcional)"
              className="w-full max-w-xs px-4 py-2.5 text-sm bg-white/5 border border-white/8 rounded-xl text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 mb-6 text-center"
            />

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => switchMode(mode)}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl text-gray-400 transition-colors"
                title="Reiniciar"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={toggleRunning}
                className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg bg-gradient-to-r ${currentMode.bgColor} hover:scale-105`}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isRunning ? 'Pausar' : 'Iniciar'}
              </button>

              <div className="p-3 bg-white/5 border border-white/8 rounded-xl text-gray-400">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Flame className={`h-4 w-4 ${sessionCount > 0 ? 'text-orange-400' : ''}`} />
                  <span className={sessionCount > 0 ? 'text-white' : ''}>{sessionCount}</span>
                </div>
              </div>
            </div>

            {/* Session dots */}
            {sessionCount > 0 && (
              <div className="flex gap-2 mt-6">
                {Array.from({ length: Math.min(sessionCount, 8) }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i < sessionCount ? 'bg-emerald-400' : 'bg-white/10'}`} />
                ))}
                {sessionCount > 8 && <span className="text-xs text-gray-500">+{sessionCount - 8}</span>}
              </div>
            )}
          </div>

          {/* Stats sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Today stats */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-semibold text-white">Hoje</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-emerald-400">{stats?.todaySessions ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Sessões</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-teal-400">{stats?.todayMinutes ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Minutos</p>
                </div>
              </div>
            </div>

            {/* Weekly chart */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-blue-400" />
                <p className="text-sm font-semibold text-white">Últimos 7 dias</p>
              </div>
              <div className="flex items-end gap-1.5 h-24">
                {weeklyData.map(([date, minutes], i) => {
                  const height = Math.max((minutes / maxMinutes) * 100, minutes > 0 ? 4 : 0)
                  const dayIndex = new Date(date + 'T12:00:00').getDay()
                  const isToday = i === weeklyData.length - 1
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1" title={`${minutes} min`}>
                      <div className="w-full flex items-end justify-center flex-1">
                        <div
                          className={`w-full rounded-t-sm transition-all ${isToday ? 'bg-emerald-400' : 'bg-white/20'}`}
                          style={{ height: `${height}%`, minHeight: minutes > 0 ? '4px' : '0px' }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{dayLabels[dayIndex]}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Técnica Pomodoro</p>
              <div className="space-y-2.5">
                {[
                  { icon: Brain, text: '25 min de foco total', color: 'text-emerald-400' },
                  { icon: Coffee, text: '5 min de pausa curta', color: 'text-blue-400' },
                  { icon: Coffee, text: 'Pausa longa a cada 4 sessões', color: 'text-violet-400' },
                  { icon: CheckCircle2, text: 'Elimine distrações durante o foco', color: 'text-amber-400' },
                ].map((tip, i) => {
                  const Icon = tip.icon
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${tip.color}`} />
                      <p className="text-xs text-gray-500">{tip.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
