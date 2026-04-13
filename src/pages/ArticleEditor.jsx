import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { createArticle, updateArticle, getArticle, subscribeToCategorias } from '../lib/db'
import { uploadFile, validateImage, validateAudio } from '../lib/cloudinary'
import CategoryModal from '../components/CategoryModal'
import {
  Bold, Italic, List, ListOrdered, Quote, Minus,
  Heading2, Heading3, ArrowLeft, Save, Loader,
  Image, Music, X, Plus
} from 'lucide-react'

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors text-sm ${
        active ? 'bg-amber-500/20 text-amber-400' : 'text-ink-500 hover:text-ink-200 hover:bg-ink-800'
      }`}
    >
      {children}
    </button>
  )
}

function UploadField({ label, icon: Icon, accept, preview, onUpload, onRemove, uploading, hint }) {
  const inputRef = useRef()
  async function handleChange(e) {
    const file = e.target.files[0]
    if (!file) return
    await onUpload(file)
    e.target.value = ''
  }
  return (
    <div>
      <label className="block text-xs font-mono text-ink-500 uppercase tracking-wider mb-2">
        {label} <span className="normal-case text-ink-600">{hint}</span>
      </label>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-ink-700/50 bg-ink-900">
          {accept.includes('image') ? (
            <img src={preview} alt="" className="w-full max-h-56 object-cover" />
          ) : (
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Music size={18} className="text-amber-500" />
              </div>
              <audio controls src={preview} className="w-full h-8" style={{ height: '32px' }} />
            </div>
          )}
          <button type="button" onClick={onRemove} className="absolute top-2 right-2 w-7 h-7 bg-ink-950/80 hover:bg-red-600/80 rounded-full flex items-center justify-center transition-colors">
            <X size={13} className="text-ink-200" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border border-dashed border-ink-700/60 hover:border-amber-500/40 rounded-xl p-6 flex flex-col items-center gap-2 text-ink-500 hover:text-ink-300 transition-all duration-200 bg-ink-900/50 hover:bg-ink-800/30 disabled:opacity-50"
        >
          {uploading ? <Loader size={20} className="animate-spin text-amber-500" /> : <Icon size={20} />}
          <span className="text-sm">{uploading ? 'Enviando...' : 'Clique para fazer upload'}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  )
}

export default function ArticleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(id)

  const [title, setTitle]         = useState('')
  const [summary, setSummary]     = useState('')
  const [category, setCategory]   = useState(searchParams.get('category') || 'characters')
  const [tags, setTags]           = useState('')
  const [imageUrl, setImageUrl]   = useState('')
  const [audioUrl, setAudioUrl]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(isEditing)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [categories, setCategories] = useState([])
  const [showCatModal, setShowCatModal] = useState(false)

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
          setImageUrl(data.imageUrl || '')
          setAudioUrl(data.audioUrl || '')
          editor.commands.setContent(data.content || '')
        }
        setLoading(false)
      })
    }
  }, [id, editor])

  async function handleImageUpload(file) {
    const err = validateImage(file)
    if (err) return alert(err)
    setUploadingImage(true)
    try { setImageUrl(await uploadFile(file, 'universe-wiki/images')) }
    catch { alert('Erro ao enviar imagem.') }
    setUploadingImage(false)
  }

  async function handleAudioUpload(file) {
    const err = validateAudio(file)
    if (err) return alert(err)
    setUploadingAudio(true)
    try { setAudioUrl(await uploadFile(file, 'universe-wiki/audios')) }
    catch { alert('Erro ao enviar áudio.') }
    setUploadingAudio(false)
  }

  async function handleSave() {
    if (!title.trim()) return alert('O título é obrigatório.')
    setSaving(true)
    const data = {
      title: title.trim(),
      summary: summary.trim(),
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      content: editor?.getHTML() || '',
      imageUrl: imageUrl || '',
      audioUrl: audioUrl || '',
    }
    try {
      if (isEditing) {
        await updateArticle(id, data)
        navigate(`/article/${id}`)
      } else {
        const ref = await createArticle(data)
        navigate(`/article/${ref.id}`)
      }
    } catch {
      alert('Erro ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader size={24} className="animate-spin text-amber-500" />
    </div>
  )

  return (
    <div className="animate-slide-up max-w-3xl">
      {showCatModal && (
        <CategoryModal
          onClose={() => setShowCatModal(false)}
          onCreated={cat => setCategory(cat.id)}
        />
      )}

      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-ink-500 hover:text-ink-300 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-2xl font-bold text-ink-50">
            {isEditing ? 'Editar artigo' : 'Novo artigo'}
          </h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="space-y-5">
        {/* Categoria */}
        <div>
          <label className="block text-xs font-mono text-ink-500 uppercase tracking-wider mb-2">Categoria</label>
          <div className="flex gap-2 flex-wrap items-center">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-all ${
                  category === cat.id
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'border-ink-700/50 text-ink-500 hover:border-ink-600 hover:text-ink-300'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCatModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-dashed border-ink-700/50 text-ink-600 hover:border-amber-500/40 hover:text-amber-500 transition-all"
            >
              <Plus size={13} />
              Nova categoria
            </button>
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="block text-xs font-mono text-ink-500 uppercase tracking-wider mb-2">Título *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nome do artigo..."
            className="w-full bg-ink-900 border border-ink-700/50 rounded-lg px-4 py-3 text-ink-100 font-display text-xl placeholder-ink-700 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Resumo */}
        <div>
          <label className="block text-xs font-mono text-ink-500 uppercase tracking-wider mb-2">Resumo</label>
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="Uma frase descrevendo este artigo..."
            rows={2}
            className="w-full bg-ink-900 border border-ink-700/50 rounded-lg px-4 py-3 text-ink-300 placeholder-ink-700 focus:outline-none focus:border-amber-500/50 resize-none text-sm"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-mono text-ink-500 uppercase tracking-wider mb-2">
            Tags <span className="normal-case text-ink-600">(separadas por vírgula)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="ex: protagonista, história 1, magia..."
            className="w-full bg-ink-900 border border-ink-700/50 rounded-lg px-4 py-2.5 text-ink-300 placeholder-ink-700 focus:outline-none focus:border-amber-500/50 text-sm font-mono"
          />
        </div>

        {/* Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UploadField label="Imagem de capa" icon={Image} accept="image/jpeg,image/png,image/webp" preview={imageUrl} onUpload={handleImageUpload} onRemove={() => setImageUrl('')} uploading={uploadingImage} hint="(JPG, PNG ou WEBP · máx. 2MB)" />
          <UploadField label="Áudio" icon={Music} accept="audio/mpeg,audio/wav,audio/ogg" preview={audioUrl} onUpload={handleAudioUpload} onRemove={() => setAudioUrl('')} uploading={uploadingAudio} hint="(MP3, WAV ou OGG · máx. 10MB)" />
        </div>

        {/* Editor */}
        <div>
          <label className="block text-xs font-mono text-ink-500 uppercase tracking-wider mb-2">Conteúdo</label>
          <div className="border border-ink-700/50 rounded-xl overflow-hidden bg-ink-900">
            <div className="flex items-center gap-0.5 p-2 border-b border-ink-800/60 flex-wrap">
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Negrito"><Bold size={14} /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Itálico"><Italic size={14} /></ToolbarBtn>
              <div className="w-px h-4 bg-ink-800 mx-1" />
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Título H2"><Heading2 size={14} /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Título H3"><Heading3 size={14} /></ToolbarBtn>
              <div className="w-px h-4 bg-ink-800 mx-1" />
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Lista"><List size={14} /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Lista numerada"><ListOrdered size={14} /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Citação"><Quote size={14} /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Separador"><Minus size={14} /></ToolbarBtn>
            </div>
            <div className="p-5 min-h-64">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Salvando...' : 'Salvar artigo'}
          </button>
        </div>
      </div>
    </div>
  )
}
