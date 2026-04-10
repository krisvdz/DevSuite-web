import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface EtfPriceCardProps {
  symbol: string
  name: string
  price: number
  changePercent: number
  isUserHolding: boolean
}

export function EtfPriceCard({ symbol, name, price, changePercent, isUserHolding }: EtfPriceCardProps) {
  const isPositive = changePercent > 0
  const isNeutral = Math.abs(changePercent) < 0.01
  const sign = isPositive ? '+' : ''

  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
  const trendColor = isNeutral ? 'text-gray-400' : isPositive ? 'text-emerald-400' : 'text-red-400'
  const bgAccent = isNeutral ? 'border-white/8' : isPositive ? 'border-emerald-500/15' : 'border-red-500/15'

  return (
    <div className={`bg-white/3 border ${bgAccent} rounded-2xl p-4 flex flex-col gap-2 transition-all hover:bg-white/5`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-base">{symbol}</span>
            {isUserHolding && (
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-md font-medium">
                Carteira
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-0.5 leading-tight line-clamp-1">{name}</p>
        </div>
        <TrendIcon className={`h-4 w-4 ${trendColor} flex-shrink-0 mt-0.5`} />
      </div>

      <div className="flex items-end justify-between">
        <span className="text-white font-semibold text-lg tabular-nums">
          ${price > 0 ? price.toFixed(2) : '—'}
        </span>
        <span className={`text-sm font-medium tabular-nums ${trendColor}`}>
          {price > 0 ? `${sign}${changePercent.toFixed(2)}%` : '—'}
        </span>
      </div>
    </div>
  )
}
