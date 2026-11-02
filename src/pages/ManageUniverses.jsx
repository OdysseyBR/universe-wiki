import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useUniverses, createUniverse, updateUniverse, deleteUniverse, slugifyUniverse,
} from '../lib/universes'
import { Pencil, Trash2, Plus, Save, X, ChevronRight, Loader, Globe } from 'lucide-react'

function EditRow({ uni, onSave, onCancel }) {
  const [label, setLabel] = useState(uni.label)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!label.trim()) return
    setSaving(true)
    try {
      await onSave(uni.id, { label: label.trim() })
      onCancel()
    } catch {
      alert('Erro ao salvar universo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-wiki-teal/30 bg-wiki-teal/5 p-3 flex items-center gap-2">
      <Globe size={16} className="text-wiki-text-muted flex-shrink-0" />
      <input type="text" value={label} onChange={e => setLabel(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
        className="flex-1 border border-wiki-border px-3 py-1.5 text-sm text-wiki-charcoal focus:outline-none focus:border-wiki-navy bg-white" />
      <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1.5">
        {saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />} Salvar
      </button>
      <button onClick={onCancel} className="btn-wiki text-xs py-1.5"><X size={12} /></button>
    </div>
  )
}

export default function ManageUniverses() {
  const universes = useUniverses()
  const [editingId, setEditingId] = useState(null)
  const [showNew, setShowNew]     = useState(false)
  const [newLabel, setNewLabel]   = useState('')
  const [saving, setSaving]       = useState(false)

  async function handleSave(id, data) {
    await updateUniverse(id, data)
  }

  async function handleDelete(uni) {
    if (!window.confirm(`Deletar universo "${uni.label}"? Os artigos deste universo não serão apagados.`)) return
    try {
      await deleteUniverse(uni.id)
    } catch {
      alert('Erro ao deletar universo.')
    }
  }

  async function handleCreate() {
    if (!newLabel.trim()) return
    const id = slugifyUniverse(newLabel)
    if (!id) return alert('Nome inválido para gerar o id.')
    setSaving(true)
    try {
      await createUniverse({ id, label: newLabel.trim() })
      setNewLabel('')
      setShowNew(false)
    } catch (err) {
      alert(err.message || 'Erro ao criar universo.')
    } finally {
      setSaving(false)
    }
  }

  const customUnis = universes.filter(u => u.custom)
  const defaultUnis = universes.filter(u => !u.custom)

  return (
    <div className="animate-fade-in">
      <div className="border-b border-wiki-border bg-wiki-bg-sidebar px-5 py-2 flex items-center gap-1 text-xs text-wiki-text-muted">
        <Link to="/" className="wiki-link">Início</Link>
        <ChevronRight size={11} />
        <span className="text-wiki-charcoal font-medium">Gerir universos</span>
      </div>

      <div className="p-5 max-w-2xl">
        <h1 className="text-2xl font-bold text-wiki-charcoal font-sans pb-2 border-b border-wiki-border mb-5">
          Gerir universos
        </h1>

        {/* Universos customizados */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-wiki-charcoal font-sans">Universos criados por você</h2>
            <button onClick={() => setShowNew(!showNew)} className="btn-wiki text-xs py-1.5">
              <Plus size={12} /> Novo universo
            </button>
          </div>

          {showNew && (
            <div className="border border-wiki-teal/30 bg-wiki-teal/5 p-3 mb-3 flex items-center gap-2">
              <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder="Nome do universo..."
                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                className="flex-1 border border-wiki-border px-3 py-1.5 text-sm text-wiki-charcoal focus:outline-none focus:border-wiki-navy bg-white" />
              <button onClick={handleCreate} disabled={saving} className="btn-primary text-xs py-1.5">
                {saving ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />} Criar
              </button>
              <button onClick={() => setShowNew(false)} className="btn-wiki text-xs py-1.5"><X size={12} /></button>
            </div>
          )}

          {customUnis.length === 0 ? (
            <p className="text-sm text-wiki-text-muted italic border border-wiki-border p-4 text-center">
              Nenhum universo criado ainda.
            </p>
          ) : (
            <div className="border border-wiki-border divide-y divide-wiki-border">
              {customUnis.map(uni => (
                <div key={uni.id}>
                  {editingId === uni.id ? (
                    <div className="p-2">
                      <EditRow uni={uni} onSave={handleSave} onCancel={() => setEditingId(null)} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-wiki-bg-sidebar transition-colors">
                      <Globe size={18} className="text-wiki-text-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-wiki-charcoal">{uni.label}</span>
                        <span className="block text-xs text-wiki-text-muted truncate">/{uni.id}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingId(uni.id)} className="p-1.5 text-wiki-text-muted hover:text-wiki-teal transition-colors rounded hover:bg-wiki-silver/40">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(uni)} className="p-1.5 text-wiki-text-muted hover:text-wiki-red transition-colors rounded hover:bg-wiki-silver/40">
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

        {/* Universos padrão */}
        <div>
          <h2 className="text-base font-bold text-wiki-charcoal font-sans mb-3">Universos padrão do sistema</h2>
          <p className="text-xs text-wiki-text-muted mb-3 italic">
            Os universos padrão não podem ser deletados, mas o nome pode ser editado.
          </p>
          <div className="border border-wiki-border divide-y divide-wiki-border">
            {defaultUnis.map(uni => (
              <div key={uni.id}>
                {editingId === uni.id ? (
                  <div className="p-2">
                    <EditRow uni={uni} onSave={handleSave} onCancel={() => setEditingId(null)} />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-wiki-bg-sidebar transition-colors">
                    <Globe size={18} className="text-wiki-text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-wiki-charcoal">{uni.label}</span>
                      <span className="block text-xs text-wiki-text-muted truncate">/{uni.id}</span>
                    </div>
                    <button onClick={() => setEditingId(uni.id)} className="p-1.5 text-wiki-text-muted hover:text-wiki-teal transition-colors rounded hover:bg-wiki-silver/40">
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
