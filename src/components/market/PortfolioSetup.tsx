import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Save, PieChart } from 'lucide-react'
import toast from 'react-hot-toast'
import { marketApi } from '../../services/api'
import { AxiosError } from 'axios'

const SUPPORTED_ETFS = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Invesco Nasdaq-100 ETF' },
  { symbol: 'GLD', name: 'SPDR Gold Shares' },
  { symbol: 'IAU', name: 'iShares Gold Trust' },
  { symbol: 'USO', name: 'United States Oil Fund' },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR' },
  { symbol: 'BITO', name: 'ProShares Bitcoin ETF' },
  { symbol: 'GBTC', name: 'Grayscale Bitcoin Trust' },
  { symbol: 'VT', name: 'Vanguard Total World Stock ETF' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
  { symbol: 'EWZ', name: 'iShares MSCI Brazil ETF' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF' },
]

interface Allocation {
  etfSymbol: string
  percentage: number
}

interface SavedAllocation extends Allocation {
  id: string
}

export function PortfolioSetup() {
  const qc = useQueryClient()
  const [allocations, setAllocations] = useState<Allocation[]>([{ etfSymbol: 'SPY', percentage: 100 }])

  const [initialized, setInitialized] = useState(false)

  const { data: savedData, isLoading } = useQuery({
    queryKey: ['market', 'portfolio'],
    queryFn: () => marketApi.getPortfolio(),
    staleTime: Infinity, // portfolio only changes when user explicitly saves
  })

  // Load saved portfolio only on first load, not on subsequent refetches
  useEffect(() => {
    if (initialized) return
    const saved: SavedAllocation[] = savedData?.data?.data ?? []
    if (saved.length > 0) {
      setAllocations(saved.map((s) => ({ etfSymbol: s.etfSymbol, percentage: s.percentage })))
      setInitialized(true)
    } else if (savedData !== undefined) {
      // Query resolved with empty portfolio — mark initialized so we don't overwrite user edits
      setInitialized(true)
    }
  }, [savedData, initialized])

  const saveMutation = useMutation({
    mutationFn: () => marketApi.savePortfolio(allocations),
    onSuccess: () => {
      toast.success('Carteira salva com sucesso!')
      qc.invalidateQueries({ queryKey: ['market', 'portfolio'] })
    },
    onError: (err: AxiosError<{ error: string }>) => {
      toast.error(err.response?.data?.error ?? 'Erro ao salvar carteira')
    },
  })

  const total = allocations.reduce((sum, a) => sum + (a.percentage || 0), 0)
  const isValid = Math.abs(total - 100) < 0.1 && allocations.length > 0

  const usedSymbols = new Set(allocations.map((a) => a.etfSymbol))
  const availableEtfs = SUPPORTED_ETFS.filter((e) => !usedSymbols.has(e.symbol))

  function addRow() {
    if (availableEtfs.length === 0) return
    setAllocations((prev) => [...prev, { etfSymbol: availableEtfs[0].symbol, percentage: 0 }])
  }

  function removeRow(index: number) {
    setAllocations((prev) => prev.filter((_, i) => i !== index))
  }

  function updateSymbol(index: number, symbol: string) {
    setAllocations((prev) => prev.map((a, i) => (i === index ? { ...a, etfSymbol: symbol } : a)))
  }

  function updatePercentage(index: number, value: string) {
    const num = parseFloat(value) || 0
    setAllocations((prev) => prev.map((a, i) => (i === index ? { ...a, percentage: num } : a)))
  }

  if (isLoading) {
    return (
      <div className="bg-white/3 border border-white/8 rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-40 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <PieChart className="h-5 w-5 text-amber-400" />
        <h2 className="text-white font-semibold text-lg">Minha Carteira</h2>
      </div>

      <div className="space-y-3 mb-4">
        {allocations.map((alloc, index) => {
          // Available options: own symbol + unused ones
          const options = SUPPORTED_ETFS.filter(
            (e) => e.symbol === alloc.etfSymbol || !usedSymbols.has(e.symbol)
          )
          return (
            <div key={index} className="flex items-center gap-3">
              <select
                value={alloc.etfSymbol}
                onChange={(e) => updateSymbol(index, e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-colors"
              >
                {options.map((etf) => (
                  <option key={etf.symbol} value={etf.symbol} className="bg-[#0d1425]">
                    {etf.symbol} — {etf.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 w-28">
                <input
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.1}
                  value={alloc.percentage || ''}
                  onChange={(e) => updatePercentage(index, e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm text-right focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-colors"
                />
                <span className="text-gray-500 text-sm flex-shrink-0">%</span>
              </div>

              <button
                onClick={() => removeRow(index)}
                disabled={allocations.length === 1}
                className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Total indicator */}
      <div className="flex items-center justify-between mb-5 px-1">
        <button
          onClick={addRow}
          disabled={availableEtfs.length === 0}
          className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Adicionar ETF
        </button>

        <div className={`text-sm font-medium flex items-center gap-2 ${
          isValid ? 'text-emerald-400' : total > 100 ? 'text-red-400' : 'text-amber-400'
        }`}>
          <span>Total:</span>
          <span className="tabular-nums">{total.toFixed(1)}%</span>
          {isValid && <span className="text-xs text-emerald-500">✓</span>}
          {!isValid && total !== 0 && (
            <span className="text-xs">
              ({total > 100 ? `−${(total - 100).toFixed(1)}%` : `+${(100 - total).toFixed(1)}% restante`})
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={!isValid || saveMutation.isPending}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:cursor-not-allowed text-black disabled:text-black/40 font-semibold text-sm rounded-xl py-2.5 transition-all"
      >
        <Save className="h-4 w-4" />
        {saveMutation.isPending ? 'Salvando...' : 'Salvar Carteira'}
      </button>
    </div>
  )
}
