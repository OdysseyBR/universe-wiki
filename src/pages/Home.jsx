import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getRecentArticles, getAllCategories, CATEGORY_LABELS, CATEGORY_ICONS } from '../lib/db'
import { Plus, Clock, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Home() {
  const { isAdmin } = useAuth()
  const [recent, setRecent] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getRecentArticles(10), getAllCategories()]).then(([arts, cats]) => {
      setRecent(arts)
      setCategories(cats)
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-6 max-w-4xl animate-fade-in">

      {/* Title */}
      <div className="border-b border-wiki-border pb-3 mb-5">
        <h1 className="text-2xl font-bold text-wiki-charcoal font-sans">Bem-vindo ao Universe Wiki</h1>
        <p className="text-sm text-wiki-text-muted mt-1">
          A enciclopédia do universo literário — {recent.length} artigos publicados
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main */}
        <div className="flex-1 min-w-0">

          {/* Intro box */}
          <div className="border border-wiki-border bg-wiki-bg-infobox p-4 mb-5 text-sm">
            <p className="text-wiki-text leading-relaxed">
              Este wiki documenta o universo literário criado pelo autor — um mundo realista com múltiplas
              histórias que abrangem temas como ciência, política, cultura e muito mais. Use o menu lateral
              para navegar pelas categorias ou a busca para encontrar artigos específicos.
            </p>
          </div>

          {/* Atualizados recentemente */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-wiki-charcoal border-b border-wiki-border pb-1 mb-3 font-sans">
              Atualizados recentemente
            </h2>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-wiki-silver/40 rounded animate-pulse" />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="text-sm text-wiki-text-muted italic py-4">
                Nenhum artigo ainda.{' '}
                {isAdmin && <Link to="/new" className="wiki-link">Criar o primeiro artigo →</Link>}
              </div>
            ) : (
              <ul className="space-y-0">
                {recent.map((article, i) => {
                  const date = article.updatedAt?.toDate
                    ? formatDistanceToNow(article.updatedAt.toDate(), { locale: ptBR, addSuffix: true })
                    : ''
                  return (
                    <li key={article.id} className={`flex items-start gap-2 py-2 text-sm ${i !== 0 ? 'border-t border-wiki-border/50' : ''}`}>
                      <span className="text-wiki-text-muted mt-0.5 flex-shrink-0">
                        {CATEGORY_ICONS[article.category] || '📄'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <Link to={`/article/${article.id}`} className="wiki-link font-medium">
                          {article.title}
                        </Link>
                        {article.summary && (
                          <span className="text-wiki-text-muted ml-2 text-xs">— {article.summary}</span>
                        )}
                      </div>
                      <span className="text-wiki-text-muted text-xs flex-shrink-0 flex items-center gap-1">
                        <Clock size={10} /> {date}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar right */}
        <div className="lg:w-56 flex-shrink-0 space-y-4">
          {/* Categorias */}
          <div className="border border-wiki-border">
            <div className="bg-wiki-navy text-white text-sm font-bold px-3 py-2">
              Categorias
            </div>
            <ul className="divide-y divide-wiki-border">
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-wiki-link hover:bg-wiki-bg-sidebar transition-colors"
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <ChevronRight size={12} className="ml-auto text-wiki-text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin box */}
          {isAdmin && (
            <div className="border border-wiki-teal/30 bg-wiki-teal/5 p-3">
              <p className="text-xs font-bold text-wiki-teal uppercase tracking-wider mb-2">Admin</p>
              <Link to="/new" className="btn-primary text-xs py-1.5 w-full justify-center">
                <Plus size={13} /> Novo artigo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
