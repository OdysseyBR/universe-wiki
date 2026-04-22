import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getArticle, deleteArticle, getAllArticles, CATEGORY_LABELS, CATEGORY_ICONS } from '../lib/db'
import { parseWikiLinks } from '../lib/wikilink'
import { Pencil, Trash2, Clock, Music, ChevronRight, Printer, Globe } from 'lucide-react'
import { getUniverseLabel, UNIVERSES } from '../lib/universes'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function buildTOC(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h2, h3')
  if (headings.length < 2) return []
  return Array.from(headings).map((h, i) => ({
    level: parseInt(h.tagName[1]),
    text: h.textContent,
    id: `heading-${i}`
  }))
}

function addHeadingIds(html) {
  let i = 0
  return html.replace(/<(h[23])(.*?)>(.*?)<\/h[23]>/g, (match, tag, attrs, text) => {
    return `<${tag}${attrs} id="heading-${i++}">${text}</${tag}>`
  })
}

function TOC({ items }) {
  if (items.length < 2) return null
  let h2count = 0
  return (
    <div className="wiki-toc float-left mr-4 mb-3 clear-left">
      <div className="wiki-toc-title">Índice</div>
      <ol className="p-3 space-y-0.5 list-none">
        {items.map(item => {
          if (item.level === 2) h2count++
          return (
            <li key={item.id} className={`text-xs ${item.level === 3 ? 'ml-4' : ''}`}>
              {item.level === 2 && <span className="text-wiki-text-muted mr-1">{h2count}</span>}
              {item.level === 3 && <span className="text-wiki-text-muted mr-1">·</span>}
              <a href={`#${item.id}`} className="text-wiki-link hover:underline">{item.text}</a>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default function Article() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [allArticles, setAllArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [parsedContent, setParsedContent] = useState('')
  const [toc, setToc] = useState([])

  useEffect(() => {
    window.scrollTo(0, 0)
    Promise.all([getArticle(id), getAllArticles()]).then(([data, all]) => {
      setArticle(data)
      setAllArticles(all)
      if (data?.content) {
        const linked = parseWikiLinks(data.content, all)
        const withIds = addHeadingIds(linked)
        setParsedContent(withIds)
        setToc(buildTOC(withIds))
      }
      setLoading(false)
    })
  }, [id])

  async function handleDelete() {
    if (!window.confirm(`Deletar "${article.title}"?`)) return
    setDeleting(true)
    await deleteArticle(id)
    navigate(-1)
  }

  function handlePrint() {
    window.print()
  }

  if (loading) return (
    <div className="p-6 animate-pulse space-y-3">
      <div className="h-6 bg-wiki-silver/40 rounded w-1/3" />
      <div className="h-4 bg-wiki-silver/40 rounded w-2/3" />
      <div className="h-40 bg-wiki-silver/40 rounded" />
    </div>
  )

  if (!article) return (
    <div className="p-6 text-center">
      <p className="text-wiki-text-muted mb-3 italic">Artigo não encontrado.</p>
      <Link to="/" className="wiki-link text-sm">← Voltar ao início</Link>
    </div>
  )

  const catLabel = CATEGORY_LABELS[article.category] || article.category
  const catIcon  = CATEGORY_ICONS[article.category] || '📄'

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="border-b border-wiki-border bg-wiki-bg-sidebar px-5 py-2 flex items-center gap-1 text-xs text-wiki-text-muted flex-wrap print:hidden">
        <Link to="/" className="wiki-link">Início</Link>
        <ChevronRight size={11} />
        <Link to={`/category/${article.category}`} className="wiki-link">{catLabel}</Link>
        <ChevronRight size={11} />
        <span className="text-wiki-charcoal font-medium">{article.title}</span>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={handlePrint} className="flex items-center gap-1 text-wiki-text-muted hover:text-wiki-navy transition-colors">
            <Printer size={11} /> Exportar PDF
          </button>
          {isAdmin && (
            <>
              <Link to={`/edit/${id}`} className="flex items-center gap-1 text-wiki-teal hover:underline">
                <Pencil size={11} /> Editar
              </Link>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-1 text-wiki-red hover:underline">
                <Trash2 size={11} /> {deleting ? '...' : 'Deletar'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-5 max-w-4xl">
        {/* Print header */}
        <div className="hidden print:flex items-center gap-2 mb-4 pb-3 border-b border-wiki-border">
          <img src="/logo.svg" alt="Focusverse" className="h-8 w-8" />
          <div>
            <p className="font-bold text-sm">Universe Wiki — Focusverse</p>
            <p className="text-xs text-wiki-text-muted">{catLabel} · {article.title}</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-wiki-charcoal font-sans pb-2 border-b border-wiki-border mb-4">
          {article.title}
        </h1>

        <div className="flex items-center gap-3 text-xs text-wiki-text-muted mb-4 flex-wrap print:hidden">
          <span className="flex items-center gap-1">
            <span>{catIcon}</span>
            <Link to={`/category/${article.category}`} className="wiki-link">{catLabel}</Link>
          </span>
          {article.universe && article.universe !== 'geral' && (
            <span className="flex items-center gap-1 bg-wiki-teal/10 border border-wiki-teal/30 text-wiki-teal px-2 py-0.5 rounded font-semibold text-xs uppercase tracking-wide">
              <Globe size={10} />
              {getUniverseLabel(article.universe, article.universeVariant)}
            </span>
          )}
          {article.universe === 'geral' && (
            <span className="flex items-center gap-1 bg-wiki-navy/10 border border-wiki-navy/20 text-wiki-navy px-2 py-0.5 rounded font-semibold text-xs uppercase tracking-wide">
              <Globe size={10} />
              Universo Geral
            </span>
          )}
          {article.tags?.map(tag => (
            <span key={tag} className="category-tag">#{tag}</span>
          ))}
          {article.updatedAt?.toDate && (
            <span className="flex items-center gap-1 ml-auto">
              <Clock size={10} />
              Atualizado {formatDistanceToNow(article.updatedAt.toDate(), { locale: ptBR, addSuffix: true })}
            </span>
          )}
        </div>

        {/* Imagem de capa principal como infobox */}
        {article.imageUrl && (
          <div className="infobox">
            <div className="infobox-title">{article.title}</div>
            <div className="infobox-image">
              <img src={article.imageUrl} alt={article.title} />
            </div>
          </div>
        )}

        {/* Galeria de imagens adicionais */}
        {article.images?.length > 0 && (
          <div className="infobox">
            <div className="infobox-title">Galeria</div>
            <div className="divide-y divide-wiki-border">
              {article.images.map((img, i) => (
                <div key={i}>
                  <img src={img.url} alt={img.caption || ''} className="w-full" />
                  {img.caption && (
                    <p className="text-xs text-wiki-text-muted text-center px-2 py-1 italic">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badge de universo */}
        {article.universe && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 border border-wiki-navy/30 bg-wiki-navy/5 text-wiki-navy text-xs font-medium rounded">
            <span>🌌</span>
            {getUniverseLabel(article.universe)}
          </div>
        )}

        {article.summary && (
          <p className="text-sm text-wiki-text leading-relaxed mb-4 italic border-l-4 border-wiki-teal pl-3 bg-wiki-bg-infobox py-2 pr-3">
            {article.summary}
          </p>
        )}

        <TOC items={toc} />

        <div
          className="wiki-content clearfix"
          dangerouslySetInnerHTML={{ __html: parsedContent || '<p class="text-wiki-text-muted italic">Sem conteúdo ainda.</p>' }}
        />

        {article.audioUrl && (
          <div className="mt-6 border border-wiki-border bg-wiki-bg-sidebar p-3 flex items-center gap-3 clear-both print:hidden">
            <Music size={16} className="text-wiki-teal flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-1">Áudio</p>
              <audio controls src={article.audioUrl} className="w-full h-8" style={{ height: '32px' }} />
            </div>
          </div>
        )}

        {article.createdAt?.toDate && (
          <div className="mt-8 pt-4 border-t border-wiki-border text-xs text-wiki-text-muted clear-both">
            Esta página foi criada em {format(article.createdAt.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
          </div>
        )}
      </div>
    </div>
  )
}
