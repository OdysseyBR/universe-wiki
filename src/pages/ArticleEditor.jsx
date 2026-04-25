import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { createArticle, updateArticle, getArticle, subscribeToCategorias } from '../lib/db'
import CategoryModal from '../components/CategoryModal'
import UniverseSelector from '../components/UniverseSelector'
import InfoboxEditor from '../components/InfoboxEditor'
import RichListEditor from '../components/RichList'
import { Bold, Italic, List, ListOrdered, Quote, Minus, Heading2, Heading3, ArrowLeft, Save, Loader, Plus } from 'lucide-react'

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`p-1.5 rounded transition-colors text-sm ${active ? 'bg-wiki-navy/10 text-wiki-navy' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
      {children}
    </button>
  )
}

export default function ArticleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(id)

  const [title, setTitle]                     = useState('')
  const [summary, setSummary]                 = useState('')
  const [category, setCategory]               = useState(searchParams.get('category') || 'characters')
  const [tags, setTags]                       = useState('')
  const [infoboxImages, setInfoboxImages]     = useState(['', '', ''])
  const [infoboxAudio, setInfoboxAudio]       = useState('')
  const [infobox, setInfobox]                 = useState([])
  const [richLists, setRichLists]             = useState([])
  const [universe, setUniverse]               = useState('geral')
  const [universeVariant, setUniverseVariant] = useState('')
  const [saving, setSaving]                   = useState(false)
  const [loading, setLoading]                 = useState(isEditing)
  const [categories, setCategories]           = useState([])
  const [showCatModal, setShowCatModal]       = useState(false)

  useEffect(() => {
    const unsub = subscribeToCategorias(setCategories)
    return () => unsub()
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do artigo aqui...' }),
    ],
    editorProps: { attributes: { class: 'tiptap-editor' } },
  })

  useEffect(() => {
    if (isEditing && editor) {
      getArticle(id).then(data => {
        if (data) {
          setTitle(data.title || '')
          setSummary(data.summary || '')
          setCategory(data.category || 'characters')
          setTags((data.tags || []).join(', '))
          setInfoboxImages(data.infoboxImages?.length === 3 ? data.infoboxImages : ['', '', ''])
          setInfoboxAudio(data.infoboxAudio || '')
          setInfobox(data.infobox || [])
          setRichLists(data.richLists || [])
          setUniverse(data.universe || 'geral')
          setUniverseVariant(data.universeVariant || '')
          editor.commands.setContent(data.content || '')
        }
        setLoading(false)
      })
    }
  }, [id, editor])

  async function handleSave() {
    if (!title.trim()) return alert('O título é obrigatório.')
    setSaving(true)
    const data = {
      title: title.trim(),
      summary: summary.trim(),
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      content: editor?.getHTML() || '',
      infoboxImages,
      infoboxAudio: infoboxAudio || '',
      infobox: infobox.filter(r => r.label?.trim() || r.value?.trim()),
      richLists,
      universe: universe || 'geral',
      universeVariant: universeVariant || '',
    }
    try {
      if (isEditing) { await updateArticle(id, data); navigate(`/article/${id}`) }
      else { const ref = await createArticle(data); navigate(`/article/${ref.id}`) }
    } catch { alert('Erro ao salvar.'); setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader size={24} className="animate-spin text-wiki-teal" /></div>

  return (
    <div className="animate-fade-in">
      {showCatModal && (
        <CategoryModal onClose={() => setShowCatModal(false)} onCreated={cat => setCategory(cat.id)} />
      )}

      {/* Topbar */}
      <div className="border-b border-wiki-border bg-wiki-bg-sidebar px-5 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-wiki-text-muted hover:text-wiki-charcoal transition-colors">
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-wiki-charcoal">{isEditing ? 'Editar artigo' : 'Novo artigo'}</span>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-1.5">
          {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="p-5 max-w-4xl space-y-6">

        {/* Categoria */}
        <div>
          <label className="block text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-2">Categoria</label>
          <div className="flex gap-2 flex-wrap items-center">
            {categories.map(cat => (
              <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border transition-all ${
                  category === cat.id
                    ? 'bg-wiki-navy/10 border-wiki-navy/30 text-wiki-navy font-semibold'
                    : 'border-wiki-border text-wiki-text-muted hover:border-wiki-navy/30 hover:text-wiki-navy'
                }`}>
                {cat.icon} {cat.label}
              </button>
            ))}
            <button type="button" onClick={() => setShowCatModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-sm border border-dashed border-wiki-border text-wiki-text-muted hover:border-wiki-teal hover:text-wiki-teal transition-all">
              <Plus size={12} /> Nova categoria
            </button>
          </div>
        </div>

        {/* Universo */}
        <UniverseSelector
          value={universe}
          variant={universeVariant}
          onChange={setUniverse}
          onVariantChange={setUniverseVariant}
        />

        {/* Título */}
        <div>
          <label className="block text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-2">Título *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do artigo..."
            className="w-full border border-wiki-border bg-white px-3 py-2.5 text-xl font-bold text-wiki-charcoal placeholder-wiki-silver focus:outline-none focus:border-wiki-navy font-sans" />
        </div>

        {/* Resumo */}
        <div>
          <label className="block text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-2">Resumo</label>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Uma frase descrevendo este artigo..." rows={2}
            className="w-full border border-wiki-border bg-white px-3 py-2 text-wiki-text placeholder-wiki-silver focus:outline-none focus:border-wiki-navy resize-none text-sm" />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-2">
            Tags <span className="normal-case font-normal text-wiki-text-muted">(separadas por vírgula)</span>
          </label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="ex: protagonista, história 1..."
            className="w-full border border-wiki-border bg-white px-3 py-2 text-wiki-text placeholder-wiki-silver focus:outline-none focus:border-wiki-navy text-sm font-mono" />
        </div>

        {/* Infobox */}
        <InfoboxEditor
          rows={infobox}
          onChange={setInfobox}
          images={infoboxImages}
          onImagesChange={setInfoboxImages}
          audio={infoboxAudio}
          onAudioChange={setInfoboxAudio}
        />

        {/* Listas detalhadas */}
        <RichListEditor lists={richLists} onChange={setRichLists} />

        {/* Editor */}
        <div>
          <label className="block text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-2">Conteúdo</label>
          <div className="border border-wiki-border bg-white">
            <div className="flex items-center gap-0.5 p-2 border-b border-wiki-border flex-wrap bg-wiki-bg-sidebar">
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Negrito"><Bold size={14} /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Itálico"><Italic size={14} /></ToolbarBtn>
              <div className="w-px h-4 bg-wiki-border mx-0.5" />
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="H2"><Heading2 size={14} /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="H3"><Heading3 size={14} /></ToolbarBtn>
              <div className="w-px h-4 bg-wiki-border mx-0.5" />
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Lista"><List size={14} /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Lista numerada"><ListOrdered size={14} /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Citação"><Quote size={14} /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Separador"><Minus size={14} /></ToolbarBtn>
            </div>
            <div className="p-4 min-h-64">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Salvando...' : 'Salvar artigo'}
          </button>
        </div>
      </div>
    </div>
  )
}
