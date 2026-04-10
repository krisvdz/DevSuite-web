import { useQuery } from '@tanstack/react-query'
import { RefreshCw, DollarSign, MoonStar } from 'lucide-react'
import { marketApi } from '../../services/api'
import { EtfPriceCard } from './EtfPriceCard'

interface PriceData {
  symbol: string
  name: string
  price: number
  changePercent: number
  previousClose: number
  fetchedAt: string
}

interface PricesResponse {
  data: PriceData[]
  isStale: boolean
  lastUpdated: string
}

interface EtfPricesSectionProps {
  portfolioSymbols: Set<string>
}

export function EtfPricesSection({ portfolioSymbols }: EtfPricesSectionProps) {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['market', 'prices'],
    queryFn: () => marketApi.getPrices(),
    staleTime: 60_000,
    refetchInterval: 60_000,
    // Never throw — component handles empty state gracefully
    retry: 1,
  })

  const response: PricesResponse = data?.data ?? { data: [], isStale: true, lastUpdated: new Date().toISOString() }
  const prices: PriceData[] = response.data ?? []
  const isStale = response.isStale ?? false
  const lastUpdated = response.lastUpdated

  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  // Sort: portfolio holdings first, then by absolute change
  const sorted = [...prices].sort((a, b) => {
    const aHolding = portfolioSymbols.has(a.symbol) ? 1 : 0
    const bHolding = portfolioSymbols.has(b.symbol) ? 1 : 0
    if (bHolding !== aHolding) return bHolding - aHolding
    return Math.abs(b.changePercent) - Math.abs(a.changePercent)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-400" />
            <h2 className="text-white font-semibold text-lg">
              {isStale && prices.length > 0 ? 'Preços — Último Pregão' : 'Preços ao Vivo'}
            </h2>
          </div>

          {isStale && prices.length > 0 && (
            <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-lg">
              <MoonStar className="h-3 w-3" />
              <span>Mercado fechado · {lastUpdatedLabel}</span>
            </div>
          )}

          {!isStale && lastUpdatedLabel && (
            <span className="text-xs text-gray-600">atualizado {lastUpdatedLabel}</span>
          )}
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Market closed info banner */}
      {isStale && prices.length > 0 && (
        <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-2.5 text-blue-300/70 text-xs mb-4">
          Exibindo preços do último fechamento. Os dados serão atualizados quando o mercado abrir
          (segunda a sexta, 09h30–16h00 ET).
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-4 animate-pulse">
              <div className="h-4 w-16 bg-white/10 rounded mb-2" />
              <div className="h-3 w-24 bg-white/5 rounded mb-3" />
              <div className="h-6 w-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : prices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MoonStar className="h-10 w-10 text-gray-700 mb-3" />
          <p className="text-gray-400 text-sm font-medium">Preços indisponíveis</p>
          <p className="text-gray-600 text-xs mt-1 max-w-xs">
            Não foi possível carregar os preços. Tente atualizar — você ainda pode gerar a análise baseada nas notícias.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" /> Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map((p) => (
            <EtfPriceCard
              key={p.symbol}
              symbol={p.symbol}
              name={p.name}
              price={p.price}
              changePercent={p.changePercent}
              isUserHolding={portfolioSymbols.has(p.symbol)}
              isStale={isStale}
            />
          ))}
        </div>
      )}
    </div>
  )
}
