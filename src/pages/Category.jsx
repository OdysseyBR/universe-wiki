import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getArticlesByCategory, CATEGORY_LABELS, CATEGORY_ICONS, CATEGORIES } from '../lib/db'
import { Plus, ArrowRight } from 'lucide-react'

export default function Category() {
  const { cat } = useParams()
  const { isAdmin } = useAuth()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  if (!CATEGORIES.includes(cat)) return <Navigate to="/" replace />

  useEffect(() => {
    setLoading(true)
    getArticlesByCategory(cat).then(data => {
      setArticles(data)
      setLoading(false)
    })
  }, [cat])

  return (
    <div className="animate-slide-up">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-3xl mb-2">{CATEGORY_ICONS[cat]}</div>
          <h1 className="font-display text-4xl font-bold text-ink-50">{CATEGORY_LABELS[cat]}</h1>
          <p className="text-ink-500 mt-1">{articles.length} {articles.length === 1 ? 'artigo' : 'artigos'}</p>
        </div>
        {isAdmin && (
          <Link to={`/new?category=${cat}`} className="btn-primary flex-shrink-0 mt-2">
            <Plus size={15} />
            Novo
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-ink-800 rounded w-1/4 mb-2" />
              <div className="h-3 bg-ink-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-ink-500 mb-4">Nenhum artigo nesta categoria ainda.</p>
          {isAdmin && (
            <Link to={`/new?category=${cat}`} className="btn-primary inline-flex">
              <Plus size={15} />
              Criar primeiro artigo
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {articles.map(article => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className="card p-4 flex items-center gap-4 hover:border-ink-700 hover:bg-ink-800/40 transition-all duration-200 group"
            >
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-semibold text-ink-100 group-hover:text-amber-400 transition-colors mb-1">
                  {article.title}
                </h2>
                {article.summary && (
                  <p className="text-sm text-ink-500 line-clamp-2">{article.summary}</p>
                )}
                {article.tags?.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {article.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <ArrowRight size={16} className="text-ink-700 group-hover:text-amber-500 flex-shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
