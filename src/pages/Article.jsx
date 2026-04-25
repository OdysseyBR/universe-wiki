import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getArticle, deleteArticle, getAllArticles, CATEGORY_LABELS, CATEGORY_ICONS } from '../lib/db'
import { parseWikiLinks } from '../lib/wikilink'
import { getUniverseLabel } from '../lib/universes'
import { RichListRenderer } from '../components/RichList'
import { Pencil, Trash2, Clock, Music, ChevronRight, Printer, Globe } from 'lucide-react'
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

function InfoboxImages({ images }) {
  const filled = (images || []).filter(Boolean)
  if (filled.length === 0) return null

  if (filled.length === 1) return (
    <div className="infobox-image">
      <img src={filled[0]} alt="" className="w-full" />
    </div>
  )

  if (filled.length === 2) return (
    <div className="infobox-image flex gap-1 p-1">
      <img src={filled[0]} alt="" className="w-1/2 object-cover" />
      <img src={filled[1]} alt="" className="w-1/2 object-cover" />
    </div>
  )

  return (
    <div className="infobox-image">
      <div className="flex gap-1 p-1 pb-0">
        <img src={filled[0]} alt="" className="w-1/2 object-cover max-h-28" />
        <img src={filled[1]} alt="" className="w-1/2 object-cover max-h-28" />
      </div>
      <div className="p-1 pt-1">
        <img src={filled[2]} alt="" className="w-full object-cover max-h-36" />
      </div>
    </div>
  )
}

export default function Article() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [article, setArticle]       = useState(null)
  const [allArticles, setAllArticles] = useState([])
  const [loading, setLoading]       = useState(true)
  const [deleting, setDeleting]     = useState(false)
  const [parsedContent, setParsedContent] = useState('')
  const [toc, setToc]               = useState([])

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
  const hasInfobox = (article.infoboxImages?.some(Boolean)) ||
                     (article.infobox?.length > 0) ||
                     article.infoboxAudio

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
          <button onClick={() => window.print()} className="flex items-center gap-1 text-wiki-text-muted hover:text-wiki-navy transition-colors">
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

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-wiki-text-muted mb-4 flex-wrap print:hidden">
          <span className="flex items-center gap-1">
            <span>{catIcon}</span>
            <Link to={`/category/${article.category}`} className="wiki-link">{catLabel}</Link>
          </span>
          {article.universe && (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-xs uppercase tracking-wide border ${
              article.universe === 'geral'
                ? 'bg-wiki-navy/10 border-wiki-navy/20 text-wiki-navy'
                : 'bg-wiki-teal/10 border-wiki-teal/30 text-wiki-teal'
            }`}>
              <Globe size={10} />
              {getUniverseLabel(article.universe, article.universeVariant)}
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

        {/* Infobox lateral */}
        {hasInfobox && (
          <div className="infobox">
            <div className="infobox-title">{article.title}</div>

            {/* Imagens: 1 grande / 2 lado a lado / 2 pequenas + 1 grande */}
            <InfoboxImages images={article.infoboxImages} />

            {/* Áudio */}
            {article.infoboxAudio && (
              <div className="border-t border-wiki-border px-2 py-2">
                <p className="text-xs text-wiki-text-muted mb-1 flex items-center gap-1">
                  <Music size={10} /> Áudio
                </p>
                <audio controls src={article.infoboxAudio} className="w-full" style={{ height: '28px' }} />
              </div>
            )}

            {/* Linhas da infobox */}
            {article.infobox?.filter(r => r.label || r.value).length > 0 && (
              <table className="w-full text-xs">
                <tbody>
                  {article.infobox.filter(r => r.label || r.value).map((row, i) => {
                    if (row.type === 'section') return (
                      <tr key={i}>
                        <td colSpan={2} className="px-2 py-1 font-bold text-wiki-navy border border-wiki-border bg-wiki-bg-infobox">
                          {row.label}
                        </td>
                      </tr>
                    )
                    return (
                      <tr key={i}>
                        <th className={`px-2 py-1 border border-wiki-border bg-wiki-bg-sidebar text-right align-top ${
                          row.type === 'sub' ? 'pl-4 font-normal text-wiki-text-muted' : 'font-semibold'
                        }`} style={{ width: '40%' }}>
                          {row.type === 'sub' && <span className="mr-1">•</span>}
                          {row.label}
                        </th>
                        <td className="px-2 py-1 border border-wiki-border align-top">{row.value}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Resumo */}
        {article.summary && (
          <p className="text-sm text-wiki-text leading-relaxed mb-4 italic border-l-4 border-wiki-teal pl-3 bg-wiki-bg-infobox py-2 pr-3">
            {article.summary}
          </p>
        )}

        {/* TOC */}
        <TOC items={toc} />

        {/* Conteúdo */}
        <div
          className="wiki-content clearfix"
          dangerouslySetInnerHTML={{ __html: parsedContent || '<p class="text-wiki-text-muted italic">Sem conteúdo ainda.</p>' }}
        />

        {/* Listas detalhadas */}
        {article.richLists?.length > 0 && (
          <RichListRenderer lists={article.richLists} />
        )}

        {/* Footer */}
        {article.createdAt?.toDate && (
          <div className="mt-8 pt-4 border-t border-wiki-border text-xs text-wiki-text-muted clear-both">
            Esta página foi criada em {format(article.createdAt.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
          </div>
        )}
      </div>
    </div>
  )
}
