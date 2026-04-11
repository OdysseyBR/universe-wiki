import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getRecentArticles, CATEGORY_LABELS, CATEGORY_ICONS, CATEGORIES } from '../lib/db'
import { Plus, Clock, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Home() {
  const { isAdmin } = useAuth()
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecentArticles(6).then(data => {
      setRecent(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="animate-slide-up">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-display text-4xl lg:text-5xl font-bold text-ink-50 leading-tight">
            Universe <span className="text-amber-500">Wiki</span>
          </h1>
          {isAdmin && (
            <Link to="/new" className="btn-primary flex-shrink-0 mt-2">
              <Plus size={16} />
              Novo artigo
            </Link>
          )}
        </div>
        <p className="text-ink-400 text-lg font-light">
          A enciclopédia do universo literário.
        </p>
      </div>

      {/* Categorias */}
      <section className="mb-10">
        <h2 className="font-display text-xl text-ink-200 mb-4">Explorar por categoria</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              to={`/category/${cat}`}
              className="card p-4 hover:border-amber-500/30 hover:bg-ink-800/60 transition-all duration-200 group"
            >
              <div className="text-2xl mb-2">{CATEGORY_ICONS[cat]}</div>
              <div className="text-sm font-medium text-ink-300 group-hover:text-ink-100 transition-colors">
                {CATEGORY_LABELS[cat]}
              </div>
              <ArrowRight size={13} className="text-ink-600 group-hover:text-amber-500 mt-2 transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recentes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-ink-500" />
          <h2 className="font-display text-xl text-ink-200">Atualizados recentemente</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-ink-800 rounded w-1/3 mb-2" />
                <div className="h-3 bg-ink-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-ink-500 mb-4">Nenhum artigo ainda.</p>
            {isAdmin && (
              <Link to="/new" className="btn-primary inline-flex">
                <Plus size={15} />
                Criar primeiro artigo
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map(article => (
              <Link
                key={article.id}
                to={`/article/${article.id}`}
                className="card p-4 flex items-start gap-4 hover:border-ink-700 hover:bg-ink-800/40 transition-all duration-200 group block"
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{CATEGORY_ICONS[article.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display font-semibold text-ink-100 group-hover:text-amber-400 transition-colors">
                      {article.title}
                    </h3>
                    <span className="tag">{CATEGORY_LABELS[article.category]}</span>
                  </div>
                  {article.summary && (
                    <p className="text-sm text-ink-500 line-clamp-1">{article.summary}</p>
                  )}
                </div>
                <div className="text-xs text-ink-600 flex-shrink-0 mt-1">
                  {article.updatedAt?.toDate
                    ? formatDistanceToNow(article.updatedAt.toDate(), { locale: ptBR, addSuffix: true })
                    : ''}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
