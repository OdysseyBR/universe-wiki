import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeToCategorias, DEFAULT_CATEGORIES } from '../lib/db'
import { db } from '../lib/firebase'
import { doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore'
import { createCategory } from '../lib/db'
import { Pencil, Trash2, Plus, Save, X, ChevronRight, Loader } from 'lucide-react'

const ICON_OPTIONS = [
  '📁','🌐','🗺️','🏔️','🌊','🌿','🔥','❄️','⚡','🌙','☀️','⭐',
  '👑','🗡️','🛡️','⚔️','🏹','🔮','📜','📚','🔬','🧬','💊','🏗️',
  '🚂','✈️','🚢','🏛️','🏰','🕌','⛪','🏟️','🏦','🏭','🌆','🌉',
  '👥','🤝','💼','🎭','🎨','🎵','🏆','🎯','💡','🔑','🗝️','📡',
  '💰','📈','⚙️','🔧','🛢️','⚛️','🧪','🌋','🏝️','🦁','🦅','🐉',
  '👤','📖','🌍','🏙️','🗾','🚩','🏢','⚙️','🏺',
]

function EditRow({ cat, onSave, onDelete, onCancel }) {
  const [label, setLabel] = useState(cat.label)
  const [icon, setIcon]   = useState(cat.icon)
  const [saving, setSaving] = useState(false)

async function handleSave(id, data) {
  await setDoc(doc(db, 'categories', id), { ...data, updatedAt: new Date() }, { merge: true })
  setEditingId(null)
}

  return (
    <div className="border border-wiki-teal/30 bg-wiki-teal/5 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <input type="text" value={label} onChange={e => setLabel(e.target.value)}
          className="flex-1 border border-wiki-border px-3 py-1.5 text-sm text-wiki-charcoal focus:outline-none focus:border-wiki-navy bg-white" />
        <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1.5">
          {saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />} Salvar
        </button>
        <button onClick={onCancel} className="btn-wiki text-xs py-1.5"><X size={12} /></button>
      </div>
      <div>
        <p className="text-xs text-wiki-text-muted mb-1">Ícone: <span className="text-base">{icon}</span></p>
        <div className="flex flex-wrap gap-1">
          {ICON_OPTIONS.map(e => (
            <button key={e} type="button" onClick={() => setIcon(e)}
              className={`text-base p-1 rounded transition-all ${icon === e ? 'bg-wiki-navy/10 ring-1 ring-wiki-navy/30' : 'hover:bg-wiki-silver/40'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ManageCategories() {
  const [categories, setCategories] = useState([])
  const [editingId, setEditingId]   = useState(null)
  const [showNew, setShowNew]       = useState(false)
  const [newLabel, setNewLabel]     = useState('')
  const [newIcon, setNewIcon]       = useState('📁')
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    const unsub = subscribeToCategorias(setCategories)
    return () => unsub()
  }, [])

  async function handleSave(id, data) {
    await updateDoc(doc(db, 'categories', id), data)
    setEditingId(null)
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Deletar categoria "${cat.label}"? Os artigos desta categoria não serão apagados.`)) return
    await deleteDoc(doc(db, 'categories', cat.id))
  }

  async function handleCreate() {
    if (!newLabel.trim()) return
    setSaving(true)
    const id = newLabel.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    await createCategory({ id, label: newLabel.trim(), icon: newIcon, custom: true })
    setNewLabel('')
    setNewIcon('📁')
    setShowNew(false)
    setSaving(false)
  }

  const customCats  = categories.filter(c => c.custom)
  const defaultCats = categories.filter(c => !c.custom)

  return (
    <div className="animate-fade-in">
      <div className="border-b border-wiki-border bg-wiki-bg-sidebar px-5 py-2 flex items-center gap-1 text-xs text-wiki-text-muted">
        <Link to="/" className="wiki-link">Início</Link>
        <ChevronRight size={11} />
        <span className="text-wiki-charcoal font-medium">Gerir categorias</span>
      </div>

      <div className="p-5 max-w-2xl">
        <h1 className="text-2xl font-bold text-wiki-charcoal font-sans pb-2 border-b border-wiki-border mb-5">
          Gerir categorias
        </h1>

        {/* Categorias customizadas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-wiki-charcoal font-sans">Categorias criadas por você</h2>
            <button onClick={() => setShowNew(!showNew)}
              className="btn-wiki text-xs py-1.5">
              <Plus size={12} /> Nova categoria
            </button>
          </div>

          {showNew && (
            <div className="border border-wiki-teal/30 bg-wiki-teal/5 p-3 mb-3 space-y-3">
              <div className="flex items-center gap-2">
                <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="Nome da categoria..."
                  className="flex-1 border border-wiki-border px-3 py-1.5 text-sm text-wiki-charcoal focus:outline-none focus:border-wiki-navy bg-white" />
                <button onClick={handleCreate} disabled={saving} className="btn-primary text-xs py-1.5">
                  {saving ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />} Criar
                </button>
                <button onClick={() => setShowNew(false)} className="btn-wiki text-xs py-1.5"><X size={12} /></button>
              </div>
              <div>
                <p className="text-xs text-wiki-text-muted mb-1">Ícone: <span className="text-base">{newIcon}</span></p>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {ICON_OPTIONS.map(e => (
                    <button key={e} type="button" onClick={() => setNewIcon(e)}
                      className={`text-base p-1 rounded ${newIcon === e ? 'bg-wiki-navy/10 ring-1 ring-wiki-navy/30' : 'hover:bg-wiki-silver/40'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {customCats.length === 0 ? (
            <p className="text-sm text-wiki-text-muted italic border border-wiki-border p-4 text-center">
              Nenhuma categoria criada ainda.
            </p>
          ) : (
            <div className="border border-wiki-border divide-y divide-wiki-border">
              {customCats.map(cat => (
                <div key={cat.id}>
                  {editingId === cat.id ? (
                    <div className="p-2">
                      <EditRow cat={cat} onSave={handleSave} onDelete={handleDelete} onCancel={() => setEditingId(null)} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-wiki-bg-sidebar transition-colors">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="flex-1 text-sm font-medium text-wiki-charcoal">{cat.label}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingId(cat.id)} className="p-1.5 text-wiki-text-muted hover:text-wiki-teal transition-colors rounded hover:bg-wiki-silver/40">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(cat)} className="p-1.5 text-wiki-text-muted hover:text-wiki-red transition-colors rounded hover:bg-wiki-silver/40">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Categorias padrão */}
        <div>
          <h2 className="text-base font-bold text-wiki-charcoal font-sans mb-3">Categorias padrão do sistema</h2>
          <p className="text-xs text-wiki-text-muted mb-3 italic">As categorias padrão não podem ser deletadas, mas o ícone e nome podem ser editados.</p>
          <div className="border border-wiki-border divide-y divide-wiki-border">
            {defaultCats.map(cat => (
              <div key={cat.id}>
                {editingId === cat.id ? (
                  <div className="p-2">
                    <EditRow cat={cat} onSave={handleSave} onDelete={null} onCancel={() => setEditingId(null)} />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-wiki-bg-sidebar transition-colors">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="flex-1 text-sm font-medium text-wiki-charcoal">{cat.label}</span>
                    <button onClick={() => setEditingId(cat.id)} className="p-1.5 text-wiki-text-muted hover:text-wiki-teal transition-colors rounded hover:bg-wiki-silver/40">
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
