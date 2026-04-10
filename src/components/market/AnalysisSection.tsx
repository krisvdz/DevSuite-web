import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, AlertTriangle, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { marketApi } from '../../services/api'
import { AxiosError } from 'axios'

interface ActionCard {
  symbol: string
  action: 'COMPRAR' | 'VENDER' | 'MANTER'
  justification: string
  confidence: 'ALTA' | 'MEDIA' | 'BAIXA'
}

interface AnalysisContent {
  summary: string
  actions: ActionCard[]
}

interface StoredAnalysis {
  id: string
  content: AnalysisContent
  createdAt: string
}

const ACTION_STYLES = {
  COMPRAR: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: TrendingUp,
    iconColor: 'text-emerald-400',
    label: 'COMPRAR',
  },
  VENDER: {
    border: 'border-red-500/40',
    bg: 'bg-red-500/10',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: TrendingDown,
    iconColor: 'text-red-400',
    label: 'VENDER',
  },
  MANTER: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Minus,
    iconColor: 'text-amber-400',
    label: 'MANTER',
  },
}

const CONFIDENCE_STYLES = {
  ALTA: 'bg-emerald-500/10 text-emerald-400',
  MEDIA: 'bg-amber-500/10 text-amber-400',
  BAIXA: 'bg-gray-500/10 text-gray-400',
}

interface AnalysisSectionProps {
  hasPortfolio: boolean
}

export function AnalysisSection({ hasPortfolio }: AnalysisSectionProps) {
  const qc = useQueryClient()

  const { data: analysisData, isLoading: loadingAnalysis } = useQuery({
    queryKey: ['market', 'analysis'],
    queryFn: () => marketApi.getAnalysis(),
  })

  const generateMutation = useMutation({
    mutationFn: () => marketApi.generateAnalysis(),
    onSuccess: () => {
      toast.success('Análise gerada com sucesso!')
      qc.invalidateQueries({ queryKey: ['market', 'analysis'] })
    },
    onError: (err: AxiosError<{ error: string }>) => {
      const msg = err.response?.data?.error ?? 'Erro ao gerar análise'
      toast.error(msg)
    },
  })

  const stored: StoredAnalysis | null = analysisData?.data?.data ?? null
  const analysis: AnalysisContent | null = stored?.content ?? null

  const createdAtLabel = stored?.createdAt
    ? new Date(stored.createdAt).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="h-5 w-5 text-amber-400" />
        <h2 className="text-white font-semibold text-lg">Análise IA</h2>
        {createdAtLabel && (
          <div className="flex items-center gap-1 text-xs text-gray-600 ml-1">
            <Clock className="h-3 w-3" />
            <span>Gerada em {createdAtLabel}</span>
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={() => generateMutation.mutate()}
        disabled={!hasPortfolio || generateMutation.isPending}
        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-amber-500/30 disabled:to-orange-500/30 disabled:cursor-not-allowed text-black disabled:text-black/30 font-semibold text-sm rounded-xl py-3 transition-all mb-5 shadow-lg shadow-amber-500/20 disabled:shadow-none"
      >
        <Sparkles className="h-4 w-4" />
        {generateMutation.isPending ? 'Consultando Claude...' : 'Gerar Análise com IA'}
      </button>

      {!hasPortfolio && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5 text-sm text-amber-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>Configure sua carteira antes de gerar uma análise.</p>
        </div>
      )}

      {generateMutation.isPending && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Analisando notícias, preços e sua carteira...</p>
          <p className="text-gray-600 text-xs mt-1">Isso pode levar alguns segundos</p>
        </div>
      )}

      {!generateMutation.isPending && loadingAnalysis && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-4 animate-pulse">
              <div className="h-5 w-24 bg-white/10 rounded mb-2" />
              <div className="h-3 w-full bg-white/5 rounded mb-1" />
              <div className="h-3 w-2/3 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      )}

      {!generateMutation.isPending && !loadingAnalysis && analysis && (
        <>
          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            {analysis.actions.map((card) => {
              const style = ACTION_STYLES[card.action] ?? ACTION_STYLES.MANTER
              const ActionIcon = style.icon
              return (
                <div
                  key={card.symbol}
                  className={`border ${style.border} ${style.bg} rounded-2xl p-4 flex flex-col gap-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ActionIcon className={`h-4 w-4 ${style.iconColor}`} />
                      <span className="text-white font-bold text-base">{card.symbol}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${style.badge}`}>
                      {style.label}
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm leading-relaxed">{card.justification}</p>

                  <div className="flex items-center justify-end">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${CONFIDENCE_STYLES[card.confidence] ?? CONFIDENCE_STYLES.MEDIA}`}>
                      Confiança: {card.confidence}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resumo do Cenário</p>
            <p className="text-gray-300 text-sm leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-600 text-center">
            Esta análise é gerada por IA e não constitui conselho financeiro profissional.
            Consulte um assessor antes de tomar decisões de investimento.
          </p>
        </>
      )}

      {!generateMutation.isPending && !loadingAnalysis && !analysis && (
        <div className="text-center py-10 text-gray-500 text-sm">
          <Sparkles className="h-8 w-8 text-gray-700 mx-auto mb-3" />
          <p>Nenhuma análise ainda.</p>
          <p className="text-xs mt-1 text-gray-600">Clique em "Gerar Análise com IA" para começar.</p>
        </div>
      )}
    </div>
  )
}
