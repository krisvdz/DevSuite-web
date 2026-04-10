import { useQuery } from '@tanstack/react-query'
import { RefreshCw, DollarSign } from 'lucide-react'
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

interface EtfPricesSectionProps {
  portfolioSymbols: Set<string>
}

export function EtfPricesSection({ portfolioSymbols }: EtfPricesSectionProps) {
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['market', 'prices'],
    queryFn: () => marketApi.getPrices(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const prices: PriceData[] = data?.data?.data ?? []

  // Sort: portfolio holdings first, then by absolute change
  const sorted = [...prices].sort((a, b) => {
    const aHolding = portfolioSymbols.has(a.symbol) ? 1 : 0
    const bHolding = portfolioSymbols.has(b.symbol) ? 1 : 0
    if (bHolding !== aHolding) return bHolding - aHolding
    return Math.abs(b.changePercent) - Math.abs(a.changePercent)
  })

  const lastUpdated = prices[0]?.fetchedAt
    ? new Date(prices[0].fetchedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-amber-400" />
          <h2 className="text-white font-semibold text-lg">Preços ao Vivo</h2>
          {lastUpdated && (
            <span className="text-xs text-gray-600">atualizado {lastUpdated}</span>
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

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-4">
          Falha ao carregar preços. O mercado pode estar fechado ou a API indisponível.
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
