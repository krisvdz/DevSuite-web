import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, PieChart, DollarSign, Newspaper, Sparkles } from 'lucide-react'
import { marketApi } from '../services/api'
import { PortfolioSetup } from '../components/market/PortfolioSetup'
import { EtfPricesSection } from '../components/market/EtfPricesSection'
import { NewsSection } from '../components/market/NewsSection'
import { AnalysisSection } from '../components/market/AnalysisSection'

type Tab = 'prices' | 'news' | 'analysis' | 'portfolio'

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: 'prices', label: 'Preços', icon: DollarSign },
  { id: 'news', label: 'Notícias', icon: Newspaper },
  { id: 'analysis', label: 'Análise IA', icon: Sparkles },
  { id: 'portfolio', label: 'Minha Carteira', icon: PieChart },
]

export function MarketPulsePage() {
  const [activeTab, setActiveTab] = useState<Tab>('prices')

  const { data: portfolioData } = useQuery({
    queryKey: ['market', 'portfolio'],
    queryFn: () => marketApi.getPortfolio(),
  })

  const portfolio: Array<{ etfSymbol: string; percentage: number }> = portfolioData?.data?.data ?? []
  const portfolioSymbols = new Set(portfolio.map((p) => p.etfSymbol))
  const hasPortfolio = portfolio.length > 0

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
            <TrendingUp className="h-5 w-5 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white">Market Pulse</h1>
        </div>
        <p className="text-gray-500 text-sm ml-12">
          Preços de ETFs, notícias do mercado e recomendações por IA
        </p>

        {/* Portfolio summary pill */}
        {hasPortfolio && (
          <div className="ml-12 mt-3 flex flex-wrap gap-2">
            {portfolio.slice(0, 6).map((p) => (
              <span
                key={p.etfSymbol}
                className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-lg font-medium"
              >
                {p.etfSymbol} {p.percentage.toFixed(0)}%
              </span>
            ))}
            {portfolio.length > 6 && (
              <span className="text-xs text-gray-600 py-1">+{portfolio.length - 6} mais</span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 border border-white/8 rounded-2xl p-1 mb-6 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="max-w-6xl">
        {activeTab === 'prices' && <EtfPricesSection portfolioSymbols={portfolioSymbols} />}
        {activeTab === 'news' && <NewsSection />}
        {activeTab === 'analysis' && <AnalysisSection hasPortfolio={hasPortfolio} />}
        {activeTab === 'portfolio' && <PortfolioSetup />}
      </div>
    </div>
  )
}
