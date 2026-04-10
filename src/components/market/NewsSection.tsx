import { useQuery } from '@tanstack/react-query'
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react'
import { marketApi } from '../../services/api'

interface NewsItem {
  title: string
  source: string
  url: string
  publishedAt: string
  relevanceTags: string[]
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

const TAG_COLORS: Record<string, string> = {
  GLD: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  IAU: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  USO: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  XLE: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  BITO: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  GBTC: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  SPY: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  QQQ: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  EWZ: 'bg-green-500/15 text-green-400 border-green-500/20',
  TLT: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  VT: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  VTI: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
}

export function NewsSection() {
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['market', 'news'],
    queryFn: () => marketApi.getNews(),
    staleTime: 600_000, // 10 min
  })

  const news: NewsItem[] = data?.data?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-amber-400" />
          <h2 className="text-white font-semibold text-lg">Notícias do Mercado</h2>
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
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          Falha ao carregar notícias. Verifique a conexão com a internet.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-2xl p-4 animate-pulse">
              <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
              <div className="h-3 w-1/2 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          Nenhuma notícia disponível no momento.
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/3 border border-white/8 rounded-2xl p-4 hover:bg-white/5 hover:border-white/15 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-gray-200 text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors">
                  {item.title}
                </p>
                <ExternalLink className="h-3.5 w-3.5 text-gray-600 group-hover:text-amber-400 transition-colors flex-shrink-0 mt-0.5" />
              </div>

              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <span className="text-xs bg-white/5 text-gray-500 px-2 py-0.5 rounded-md border border-white/8">
                  {item.source}
                </span>
                <span className="text-xs text-gray-600">{timeAgo(item.publishedAt)}</span>

                {item.relevanceTags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${TAG_COLORS[tag] ?? 'bg-amber-500/15 text-amber-400 border-amber-500/20'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
