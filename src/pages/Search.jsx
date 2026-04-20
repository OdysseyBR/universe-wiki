import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { searchArticles, getAllArticles, CATEGORY_LABELS, CATEGORY_ICONS } from '../lib/db'
import { Search, Loader, ChevronRight } from 'lucide-react'

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
        setResults(all.filter(a => (a.tags || []).some(t => t.toLowerCase().includes(searchTerm))))
        setLoading(false)
      })
    } else {
      searchArticles(q).then(data => { setResults(data); setLoading(false) })
    }
  }, [q])

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) setSearchParams({ q: query.trim() })
  }

  return (
    <div className="animate-fade-in">
      <div className="border-b border-wiki-border bg-wiki-bg-sidebar px-5 py-2 flex items-center gap-1 text-xs text-wiki-text-muted">
        <Link to="/" className="wiki-link">Início</Link>
        <ChevronRight size={11} />
        <span className="text-wiki-charcoal font-medium">Buscar</span>
      </div>

      <div className="p-5 max-w-3xl">
        <h1 className="text-2xl font-bold text-wiki-charcoal font-sans pb-2 border-b border-wiki-border mb-5">
          Buscar no wiki
        </h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar artigos... ou #tag"
            className="flex-1 border border-wiki-border text-sm px-3 py-2 focus:outline-none focus:border-wiki-navy text-wiki-text bg-white rounded"
            autoFocus
          />
          <button type="submit" className="btn-primary px-5">
            {loading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
            Buscar
          </button>
        </form>

        <p className="text-xs text-wiki-text-muted mb-5">
          Use <code className="bg-wiki-silver/40 px-1 rounded">#tag</code> para buscar por tag específica.
        </p>

        {!loading && searched && (
          <>
            <p className="text-sm text-wiki-text-muted mb-3 pb-2 border-b border-wiki-border">
              {results.length === 0
                ? `Nenhum resultado para "${q}".`
                : `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${q}"`
              }
            </p>
            <div className="space-y-0">
              {results.map((article, i) => (
                <div key={article.id} className={`py-3 text-sm ${i !== 0 ? 'border-t border-wiki-border/50' : ''}`}>
                  <Link to={`/article/${article.id}`} className="wiki-link font-medium text-base">
                    {article.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-wiki-text-muted text-xs">
                      {CATEGORY_ICONS[article.category]} {CATEGORY_LABELS[article.category] || article.category}
                    </span>
                    {article.tags?.map(tag => (
                      <span key={tag} className={`category-tag ${isTagSearch && tag.toLowerCase().includes(searchTerm) ? 'bg-wiki-gold/20 border-wiki-gold/40 text-wiki-charcoal' : ''}`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {article.summary && (
                    <p className="text-wiki-text-muted text-xs mt-1 line-clamp-2">{article.summary}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
