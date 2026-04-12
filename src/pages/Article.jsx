import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getArticle, deleteArticle, CATEGORY_LABELS, CATEGORY_ICONS } from '../lib/db'
import { Pencil, Trash2, ArrowLeft, Clock, Music } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Article() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getArticle(id).then(data => {
      setArticle(data)
      setLoading(false)
    })
  }, [id])

  async function handleDelete() {
    if (!window.confirm(`Deletar "${article.title}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(true)
    await deleteArticle(id)
    navigate(-1)
  }

  if (loading) return (
    <div className="animate-pulse space-y-4 max-w-3xl">
      <div className="h-56 bg-ink-800 rounded-xl" />
      <div className="h-8 bg-ink-800 rounded w-1/2" />
      <div className="h-4 bg-ink-800 rounded w-1/4" />
      <div className="h-40 bg-ink-800 rounded" />
    </div>
  )

  if (!article) return (
    <div className="text-center py-20">
      <p className="text-ink-500 mb-4">Artigo não encontrado.</p>
      <Link to="/" className="btn-ghost">Voltar ao início</Link>
    </div>
  )

  return (
    <div className="animate-slide-up max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <button onClick={() => navigate(-1)} className="text-ink-500 hover:text-ink-300 flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} />
          Voltar
        </button>
        <span className="text-ink-700">/</span>
        <Link to={`/category/${article.category}`} className="text-ink-500 hover:text-amber-400 transition-colors">
          {CATEGORY_ICONS[article.category]} {CATEGORY_LABELS[article.category]}
        </Link>
      </div>

      {/* Imagem de capa */}
      {article.imageUrl && (
        <div className="mb-8 rounded-2xl overflow-hidden border border-ink-800/60">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full max-h-72 object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8 pb-8 border-b border-ink-800/60">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-4xl font-bold text-ink-50 leading-tight flex-1">
            {article.title}
          </h1>
          {isAdmin && (
            <div className="flex gap-2 flex-shrink-0 mt-1">
              <Link to={`/edit/${id}`} className="btn-ghost">
                <Pencil size={14} />
                Editar
              </Link>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                <Trash2 size={14} />
                {deleting ? '...' : 'Deletar'}
              </button>
            </div>
          )}
        </div>

        {article.summary && (
          <p className="text-ink-400 text-lg mt-3 font-light leading-relaxed">{article.summary}</p>
        )}

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {article.tags?.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
          {article.updatedAt?.toDate && (
            <span className="text-xs text-ink-600 flex items-center gap-1 ml-auto">
              <Clock size={11} />
              Atualizado {formatDistanceToNow(article.updatedAt.toDate(), { locale: ptBR, addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div
        className="wiki-content"
        dangerouslySetInnerHTML={{ __html: article.content || '<p class="text-ink-600 italic">Sem conteúdo ainda.</p>' }}
      />

      {/* Player de áudio */}
      {article.audioUrl && (
        <div className="mt-10 p-4 card flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Music size={18} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-ink-500 uppercase tracking-wider mb-1.5">Áudio</p>
            <audio controls src={article.audioUrl} className="w-full" style={{ height: '36px' }} />
          </div>
        </div>
      )}

      {/* Footer */}
      {article.createdAt?.toDate && (
        <div className="mt-12 pt-6 border-t border-ink-800/60 text-xs text-ink-700 font-mono">
          Criado em {format(article.createdAt.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
      )}
    </div>
  )
}
