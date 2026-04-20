import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getArticlesByCategory, getAllCategories, CATEGORY_LABELS, CATEGORY_ICONS } from '../lib/db'
import { Plus, ChevronRight, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Category() {
  const { cat } = useParams()
  const { isAdmin } = useAuth()
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [catInfo, setCatInfo] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getArticlesByCategory(cat),
      getAllCategories()
    ]).then(([arts, cats]) => {
      setArticles(arts)
      setCategories(cats)
      const found = cats.find(c => c.id === cat)
      setCatInfo(found)
      setLoading(false)
    })
  }, [cat])

  if (!loading && !catInfo) return <Navigate to="/" replace />

  const label = catInfo?.label || cat
  const icon  = catInfo?.icon || '📄'

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="border-b border-wiki-border bg-wiki-bg-sidebar px-5 py-2 flex items-center gap-1 text-xs text-wiki-text-muted">
        <Link to="/" className="wiki-link">Início</Link>
        <ChevronRight size={11} />
        <span className="text-wiki-charcoal font-medium">{label}</span>
        {isAdmin && (
          <Link to={`/new?category=${cat}`} className="ml-auto flex items-center gap-1 text-wiki-teal hover:underline font-medium">
            <Plus size={11} /> Novo artigo
          </Link>
        )}
      </div>

      <div className="p-5 max-w-4xl">
        <h1 className="text-2xl font-bold text-wiki-charcoal font-sans pb-2 border-b border-wiki-border mb-4 flex items-center gap-2">
          <span>{icon}</span> {label}
        </h1>

        <p className="text-sm text-wiki-text-muted mb-5 italic">
          {loading ? '...' : `${articles.length} ${articles.length === 1 ? 'artigo' : 'artigos'} nesta categoria`}
        </p>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-wiki-silver/40 rounded animate-pulse" />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="border border-wiki-border bg-wiki-bg-sidebar p-5 text-sm text-wiki-text-muted italic text-center">
            Nenhum artigo nesta categoria.{' '}
            {isAdmin && <Link to={`/new?category=${cat}`} className="wiki-link not-italic">Criar o primeiro →</Link>}
          </div>
        ) : (
          <div className="space-y-0">
            {articles.map((article, i) => {
              const date = article.updatedAt?.toDate
                ? formatDistanceToNow(article.updatedAt.toDate(), { locale: ptBR, addSuffix: true })
                : ''
              return (
                <div key={article.id} className={`flex items-start gap-3 py-3 text-sm ${i !== 0 ? 'border-t border-wiki-border/50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <Link to={`/article/${article.id}`} className="wiki-link font-medium text-base">
                      {article.title}
                    </Link>
                    {article.summary && (
                      <p className="text-wiki-text-muted text-xs mt-0.5 line-clamp-2">{article.summary}</p>
                    )}
                    {article.tags?.length > 0 && (
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {article.tags.map(tag => (
                          <span key={tag} className="category-tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-wiki-text-muted text-xs flex-shrink-0 flex items-center gap-1 mt-0.5">
                    <Clock size={10} /> {date}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
