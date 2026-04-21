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
  Image, Music, X, Plus, Trash2, GripVertical
} from 'lucide-react'

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`p-1.5 rounded transition-colors text-sm ${active ? 'bg-wiki-navy/10 text-wiki-navy' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
      {children}
    </button>
  )
}

function UploadBtn({ icon: Icon, accept, onUpload, uploading, label }) {
  const ref = useRef()
  async function handleChange(e) {
    const file = e.target.files[0]
    if (!file) return
    await onUpload(file)
    e.target.value = ''
  }
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
        title={label}
        className="p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-40">
        {uploading ? <Loader size={14} className="animate-spin" /> : <Icon size={14} />}
      </button>
      <input ref={ref} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </>
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
  const [images, setImages]       = useState([]) // galeria
  const [audioUrl, setAudioUrl]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(isEditing)
  const [uploadingCover, setUploadingCover]   = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [uploadingAudio, setUploadingAudio]   = useState(false)
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
          setImages(data.images || [])
          setAudioUrl(data.audioUrl || '')
          editor.commands.setContent(data.content || '')
        }
        setLoading(false)
      })
    }
  }, [id, editor])

  async function handleCoverUpload(file) {
    const err = validateImage(file)
    if (err) return alert(err)
    setUploadingCover(true)
    try { setImageUrl(await uploadFile(file, 'universe-wiki/images')) }
    catch { alert('Erro ao enviar imagem.') }
    setUploadingCover(false)
  }

  async function handleGalleryUpload(file) {
    const err = validateImage(file)
    if (err) return alert(err)
    setUploadingGallery(true)
    try {
      const url = await uploadFile(file, 'universe-wiki/images')
      setImages(prev => [...prev, { url, caption: '' }])
    } catch { alert('Erro ao enviar imagem.') }
    setUploadingGallery(false)
  }

  function updateCaption(i, caption) {
    setImages(prev => prev.map((img, idx) => idx === i ? { ...img, caption } : img))
  }

  function removeImage(i) {
    setImages(prev => prev.filter((_, idx) => idx !== i))
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
      images: images || [],
      audioUrl: audioUrl || '',
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
          <span className="text-sm font-semibold text-wiki-charcoal">
            {isEditing ? 'Editar artigo' : 'Novo artigo'}
          </span>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-1.5">
          {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="p-5 max-w-4xl">
        <div className="space-y-4">

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

          {/* Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Capa */}
            <div>
              <label className="block text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-2">
                Imagem de capa (infobox)
              </label>
              {imageUrl ? (
                <div className="relative border border-wiki-border">
                  <img src={imageUrl} alt="" className="w-full max-h-40 object-cover" />
                  <button type="button" onClick={() => setImageUrl('')}
                    className="absolute top-1 right-1 w-6 h-6 bg-wiki-red/80 rounded-full flex items-center justify-center text-white">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border border-dashed border-wiki-border bg-wiki-bg-sidebar hover:bg-wiki-silver/30 p-6 cursor-pointer transition-colors">
                  {uploadingCover ? <Loader size={18} className="animate-spin text-wiki-teal" /> : <Image size={18} className="text-wiki-text-muted" />}
                  <span className="text-xs text-wiki-text-muted mt-1">{uploadingCover ? 'Enviando...' : 'Clique para upload'}</span>
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) handleCoverUpload(f); e.target.value = '' }} className="hidden" />
                </label>
              )}
            </div>

            {/* Áudio */}
            <div>
              <label className="block text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-2">Áudio</label>
              {audioUrl ? (
                <div className="border border-wiki-border bg-wiki-bg-sidebar p-3">
                  <audio controls src={audioUrl} className="w-full" style={{ height: '32px' }} />
                  <button type="button" onClick={() => setAudioUrl('')} className="text-xs text-wiki-red hover:underline mt-1 flex items-center gap-1">
                    <X size={11} /> Remover
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border border-dashed border-wiki-border bg-wiki-bg-sidebar hover:bg-wiki-silver/30 p-6 cursor-pointer transition-colors">
                  {uploadingAudio ? <Loader size={18} className="animate-spin text-wiki-teal" /> : <Music size={18} className="text-wiki-text-muted" />}
                  <span className="text-xs text-wiki-text-muted mt-1">{uploadingAudio ? 'Enviando...' : 'Clique para upload'}</span>
                  <input type="file" accept="audio/*" onChange={e => { const f = e.target.files[0]; if (f) handleAudioUpload(f); e.target.value = '' }} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Galeria */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-wiki-text-muted uppercase tracking-wider">
                Galeria de imagens <span className="normal-case font-normal">({images.length} imagem{images.length !== 1 ? 's' : ''})</span>
              </label>
              <label className="flex items-center gap-1 text-xs text-wiki-teal hover:underline cursor-pointer font-medium">
                {uploadingGallery ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />}
                {uploadingGallery ? 'Enviando...' : 'Adicionar imagem'}
                <input type="file" accept="image/*" disabled={uploadingGallery}
                  onChange={e => { const f = e.target.files[0]; if (f) handleGalleryUpload(f); e.target.value = '' }}
                  className="hidden" />
              </label>
            </div>
            {images.length > 0 && (
              <div className="space-y-2 border border-wiki-border p-3 bg-wiki-bg-sidebar">
                {images.map((img, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white border border-wiki-border p-2">
                    <img src={img.url} alt="" className="w-16 h-12 object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={img.caption}
                        onChange={e => updateCaption(i, e.target.value)}
                        placeholder="Legenda da imagem (opcional)"
                        className="w-full text-xs border border-wiki-border px-2 py-1 focus:outline-none focus:border-wiki-navy text-wiki-text"
                      />
                    </div>
                    <button type="button" onClick={() => removeImage(i)} className="text-wiki-red hover:opacity-80 flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor */}
          <div>
            <label className="block text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-2">Conteúdo</label>
            <div className="border border-wiki-border bg-white">
              {/* Toolbar */}
              <div className="flex items-center gap-0.5 p-2 border-b border-wiki-border flex-wrap bg-wiki-bg-sidebar">
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Negrito"><Bold size={14} /></ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Itálico"><Italic size={14} /></ToolbarBtn>
                <div className="w-px h-4 bg-wiki-border mx-0.5" />
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Título H2"><Heading2 size={14} /></ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="Título H3"><Heading3 size={14} /></ToolbarBtn>
                <div className="w-px h-4 bg-wiki-border mx-0.5" />
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Lista com marcadores"><List size={14} /></ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Lista numerada"><ListOrdered size={14} /></ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleTaskList?.().run()} active={editor?.isActive('taskList')} title="Lista de tarefas">☑</ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Citação"><Quote size={14} /></ToolbarBtn>
                <ToolbarBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Separador"><Minus size={14} /></ToolbarBtn>
              </div>
              <div className="p-4 min-h-64">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Salvando...' : 'Salvar artigo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
