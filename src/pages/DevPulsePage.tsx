import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Star, GitFork, ExternalLink, TrendingUp, Code2, RefreshCw, Search } from 'lucide-react'
import axios from 'axios'

const LANGUAGES = [
  { label: 'TypeScript', color: '#3178c6' },
  { label: 'JavaScript', color: '#f1e05a' },
  { label: 'Python', color: '#3572A5' },
  { label: 'Go', color: '#00ADD8' },
  { label: 'Rust', color: '#dea584' },
  { label: 'Java', color: '#b07219' },
  { label: 'C++', color: '#f34b7d' },
  { label: 'Kotlin', color: '#A97BFF' },
]

interface GithubRepo {
  id: number
  full_name: string
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  watchers_count: number
  language: string | null
  topics: string[]
  updated_at: string
  owner: { avatar_url: string; login: string }
}

function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  const months = Math.floor(days / 30)
  return `há ${months} ${months === 1 ? 'mês' : 'meses'}`
}

function getLangColor(lang: string | null) {
  return LANGUAGES.find((l) => l.label === lang)?.color ?? '#8b5cf6'
}

// ─────────────────────────────────────────────────────────────────────────────
// 📚 CONCEITO: Toggle state — null como "nenhum selecionado"
//
// Antes: setSelectedLang(lang.label) → sempre atribuía, nunca desmarcava
// Depois: selectedLang === lang.label ? null : lang.label → toggle real
//
// null como valor de estado é diferente de undefined ou ''.
// Null tem semântica de "intencionalmente vazio/sem seleção".
// ─────────────────────────────────────────────────────────────────────────────

export function DevPulsePage() {
  const [selectedLang, setSelectedLang] = useState<string | null>('TypeScript')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading, error, refetch, isFetching } = useQuery<GithubRepo[]>({
    queryKey: ['github-trending', selectedLang],
    // enabled: false desativa a query enquanto não há linguagem selecionada
    enabled: selectedLang !== null,
    queryFn: async () => {
      const q = `stars:>1000 language:${selectedLang!.toLowerCase().replace('+', 'plus').replace('#', 'sharp')} pushed:>${new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)}`
      const res = await axios.get('https://api.github.com/search/repositories', {
        params: { q, sort: 'stars', order: 'desc', per_page: 20 },
        headers: { Accept: 'application/vnd.github.v3+json' },
      })
      return res.data.items as GithubRepo[]
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  })

  const filtered = (data ?? []).filter((repo) =>
    searchQuery
      ? repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true
  )

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <h1 className="text-xl font-bold">Dev Pulse</h1>
              </div>
              <p className="text-sm text-gray-500">Repositórios trending no GitHub por linguagem</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar repositório..."
                  className="pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 w-52"
                />
              </div>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                title="Atualizar"
              >
                <RefreshCw className={`h-4 w-4 text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Language filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.label}
                onClick={() => setSelectedLang((prev) => (prev === lang.label ? null : lang.label))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all flex-shrink-0 ${
                  selectedLang === lang.label
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    : 'bg-white/3 border-white/8 text-gray-500 hover:text-gray-300 hover:border-white/15'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: lang.color }}
                />
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Empty state: no language selected */}
        {selectedLang === null && (
          <div className="text-center py-20">
            <div className="inline-flex p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4">
              <Code2 className="h-10 w-10 text-blue-400" />
            </div>
            <p className="text-gray-300 font-medium mb-1">Selecione uma linguagem</p>
            <p className="text-sm text-gray-600">Escolha uma linguagem acima para explorar repositórios trending</p>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-white/3 border border-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <Code2 className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Erro ao buscar repositórios</p>
            <p className="text-sm text-gray-600">GitHub API pode estar com rate limit. Tente novamente em um momento.</p>
            <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-300 hover:bg-blue-500/30 transition-colors">
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum resultado para "{searchQuery}"</p>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <>
            <p className="text-xs text-gray-600 mb-4">{filtered.length} repositórios encontrados</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((repo, index) => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-white/3 border border-white/8 hover:border-blue-500/30 hover:bg-white/5 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={repo.owner.avatar_url}
                        alt={repo.owner.login}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                          {repo.full_name}
                        </p>
                        {index < 3 && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-1.5 rounded">
                            <TrendingUp className="h-2.5 w-2.5" />
                            Trending
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-600 group-hover:text-blue-400 flex-shrink-0 mt-0.5 transition-colors" />
                  </div>

                  {repo.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                      {repo.description}
                    </p>
                  )}

                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {repo.topics.slice(0, 3).map((topic) => (
                        <span key={topic} className="text-xs bg-blue-500/10 text-blue-400/80 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLangColor(repo.language) }} />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" /> {formatNumber(repo.stargazers_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" /> {formatNumber(repo.forks_count)}
                    </span>
                    <span className="ml-auto">{timeAgo(repo.updated_at)}</span>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
