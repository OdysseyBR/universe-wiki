import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { searchArticles, CATEGORY_LABELS, CATEGORY_ICONS } from '../lib/db'
import { Search, ArrowRight, Loader } from 'lucide-react'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState(q)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    setSearched(true)
    searchArticles(q).then(data => {
      setResults(data)
      setLoading(false)
    })
  }, [q])

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) setSearchParams({ q: query.trim() })
  }

  return (
    <div className="animate-slide-up max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-ink-50 mb-6">Buscar</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar artigos, personagens, locais..."
              className="w-full bg-ink-900 border border-ink-700/50 rounded-xl pl-11 pr-4 py-3 text-ink-200 placeholder-ink-600 focus:outline-none focus:border-amber-500/50"
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary px-6">Buscar</button>
        </div>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-ink-500">
          <Loader size={16} className="animate-spin" />
          <span className="text-sm">Buscando...</span>
        </div>
      )}

      {!loading && searched && (
        <>
          <p className="text-sm text-ink-500 mb-4">
            {results.length === 0
              ? `Nenhum resultado para "${q}"`
              : `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${q}"`
            }
          </p>
          <div className="space-y-3">
            {results.map(article => (
              <Link
                key={article.id}
                to={`/article/${article.id}`}
                className="card p-4 flex items-center gap-4 hover:border-ink-700 hover:bg-ink-800/40 transition-all duration-200 group block"
              >
                <span className="text-xl flex-shrink-0">{CATEGORY_ICONS[article.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-ink-100 group-hover:text-amber-400 transition-colors">
                      {article.title}
                    </h3>
                    <span className="tag">{CATEGORY_LABELS[article.category]}</span>
                  </div>
                  {article.summary && (
                    <p className="text-sm text-ink-500 line-clamp-1">{article.summary}</p>
                  )}
                </div>
                <ArrowRight size={15} className="text-ink-700 group-hover:text-amber-500 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
