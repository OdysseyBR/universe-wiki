import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { searchArticles, getAllArticles, CATEGORY_LABELS, CATEGORY_ICONS } from '../lib/db'
import { Search, ArrowRight, Loader, Hash } from 'lucide-react'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState(q)
  const [searched, setSearched] = useState(false)

  const isTagSearch = q.startsWith('#')
  const searchTerm = isTagSearch ? q.slice(1).toLowerCase().trim() : q

  useEffect(() => {
    if (!q) return
    setLoading(true)
    setSearched(true)

    if (isTagSearch) {
      getAllArticles().then(all => {
        const filtered = all.filter(a =>
          (a.tags || []).some(tag => tag.toLowerCase().includes(searchTerm))
        )
        setResults(filtered)
        setLoading(false)
      })
    } else {
      searchArticles(q).then(data => {
        setResults(data)
        setLoading(false)
      })
    }
  }, [q])

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) setSearchParams({ q: query.trim() })
  }

  return (
    <div className="animate-slide-up max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-ink-50 mb-2">Buscar</h1>
      <p className="text-ink-500 text-sm mb-6">
        Use <span className="font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">#nome</span> para buscar por tag
      </p>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            {query.startsWith('#')
              ? <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
              : <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
            }
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar artigos... ou #tag"
              className={`w-full bg-ink-900 border rounded-xl pl-11 pr-4 py-3 text-ink-200 placeholder-ink-600 focus:outline-none transition-colors ${
                query.startsWith('#')
                  ? 'border-amber-500/40 focus:border-amber-500/70'
                  : 'border-ink-700/50 focus:border-amber-500/50'
              }`}
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
          <div className="flex items-center gap-2 mb-4">
            {isTagSearch && (
              <span className="flex items-center gap-1 text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-md">
                <Hash size={11} />
                {searchTerm}
              </span>
            )}
            <p className="text-sm text-ink-500">
              {results.length === 0
                ? `Nenhum resultado para "${q}"`
                : `${results.length} resultado${results.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          <div className="space-y-3">
            {results.map(article => (
              <Link
                key={article.id}
                to={`/article/${article.id}`}
                className="card p-4 flex items-center gap-4 hover:border-ink-700 hover:bg-ink-800/40 transition-all duration-200 group block"
              >
                <span className="text-xl flex-shrink-0">{CATEGORY_ICONS[article.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display font-semibold text-ink-100 group-hover:text-amber-400 transition-colors">
                      {article.title}
                    </h3>
                    <span className="tag">{CATEGORY_LABELS[article.category]}</span>
                  </div>
                  {article.tags?.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {article.tags.map(tag => (
                        <span
                          key={tag}
                          className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                            isTagSearch && tag.toLowerCase().includes(searchTerm)
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'tag'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
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
