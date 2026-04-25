import { useState, useRef } from 'react'
import { Plus, Trash2, Image, X, Loader } from 'lucide-react'
import { uploadFile, validateImage } from '../lib/cloudinary'

const MAX_ITEMS = 20

export default function RichListEditor({ lists, onChange }) {

  function addList() {
    onChange([...lists, { title: '', items: [] }])
  }

  function removeList(li) {
    onChange(lists.filter((_, i) => i !== li))
  }

  function updateListTitle(li, title) {
    onChange(lists.map((l, i) => i === li ? { ...l, title } : l))
  }

  function addItem(li) {
    if (lists[li].items.length >= MAX_ITEMS) return
    onChange(lists.map((l, i) => i === li
      ? { ...l, items: [...l.items, { image: '', title: '', description: '' }] }
      : l))
  }

  function removeItem(li, ii) {
    onChange(lists.map((l, i) => i === li
      ? { ...l, items: l.items.filter((_, j) => j !== ii) }
      : l))
  }

  function updateItem(li, ii, field, value) {
    onChange(lists.map((l, i) => i === li
      ? { ...l, items: l.items.map((it, j) => j === ii ? { ...it, [field]: value } : it) }
      : l))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-wiki-text-muted uppercase tracking-wider">
          Listas detalhadas
        </label>
        <button type="button" onClick={addList}
          className="flex items-center gap-1 text-xs text-wiki-teal hover:underline font-medium">
          <Plus size={12} /> Nova lista
        </button>
      </div>

      {lists.map((list, li) => (
        <div key={li} className="border border-wiki-border bg-wiki-bg-sidebar">
          <div className="flex items-center gap-2 p-2 border-b border-wiki-border bg-white">
            <input
              type="text"
              value={list.title}
              onChange={e => updateListTitle(li, e.target.value)}
              placeholder="Título da lista (ex: Estados membros)..."
              className="flex-1 text-sm font-semibold border border-wiki-border px-2 py-1 text-wiki-charcoal focus:outline-none focus:border-wiki-navy"
            />
            <button type="button" onClick={() => removeList(li)} className="text-wiki-red hover:opacity-80 flex-shrink-0">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="divide-y divide-wiki-border">
            {list.items.map((item, ii) => (
              <RichListItem
                key={ii}
                item={item}
                index={ii}
                onUpdate={(field, value) => updateItem(li, ii, field, value)}
                onRemove={() => removeItem(li, ii)}
              />
            ))}
          </div>

          <div className="p-2 border-t border-wiki-border">
            <button type="button" onClick={() => addItem(li)} disabled={list.items.length >= MAX_ITEMS}
              className="flex items-center gap-1 text-xs text-wiki-navy hover:underline font-medium disabled:opacity-40">
              <Plus size={12} /> Adicionar item ({list.items.length}/{MAX_ITEMS})
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function RichListItem({ item, index, onUpdate, onRemove }) {
  const [uploading, setUploading] = useState(false)
  const ref = useRef()

  async function handleImage(file) {
    const err = validateImage(file)
    if (err) return alert(err)
    setUploading(true)
    try {
      const url = await uploadFile(file, 'universe-wiki/lists')
      onUpdate('image', url)
    } catch { alert('Erro ao enviar imagem.') }
    setUploading(false)
    if (ref.current) ref.current.value = ''
  }

  return (
    <div className="flex items-start gap-2 p-2 bg-white">
      <span className="text-xs text-wiki-text-muted font-mono mt-2 w-5 flex-shrink-0">{index + 1}</span>

      <div className="flex-shrink-0">
        {item.image ? (
          <div className="relative w-16 h-16">
            <img src={item.image} alt="" className="w-16 h-16 object-cover border border-wiki-border" />
            <button type="button" onClick={() => onUpdate('image', '')}
              className="absolute -top-1 -right-1 w-4 h-4 bg-wiki-red rounded-full flex items-center justify-center text-white">
              <X size={9} />
            </button>
          </div>
        ) : (
          <label className="w-16 h-16 border border-dashed border-wiki-border flex flex-col items-center justify-center cursor-pointer hover:bg-wiki-bg-sidebar transition-colors">
            {uploading
              ? <Loader size={14} className="animate-spin text-wiki-teal" />
              : <Image size={14} className="text-wiki-text-muted" />
            }
            <span className="text-wiki-text-muted mt-0.5" style={{ fontSize: '9px' }}>
              {uploading ? '...' : 'Foto'}
            </span>
            <input ref={ref} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) handleImage(f) }} />
          </label>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <input type="text" value={item.title} onChange={e => onUpdate('title', e.target.value)}
          placeholder="Título do item..."
          className="w-full text-xs font-semibold border border-wiki-border px-2 py-1 text-wiki-charcoal focus:outline-none focus:border-wiki-navy" />
        <textarea value={item.description} onChange={e => onUpdate('description', e.target.value)}
          placeholder="Descrição (opcional)..."
          rows={2}
          className="w-full text-xs border border-wiki-border px-2 py-1 text-wiki-text focus:outline-none focus:border-wiki-navy resize-none" />
      </div>

      <button type="button" onClick={onRemove} className="text-wiki-text-muted hover:text-wiki-red flex-shrink-0 mt-1">
        <Trash2 size={13} />
      </button>
    </div>
  )
}

export function RichListRenderer({ lists }) {
  if (!lists?.length) return null
  return (
    <div className="space-y-6 clear-both mt-4">
      {lists.map((list, li) => (
        <div key={li}>
          {list.title && (
            <h3 className="font-sans font-bold text-wiki-charcoal border-b border-wiki-border pb-1 mb-0 text-base">
              {list.title}
            </h3>
          )}
          <table className="w-full border-collapse text-sm">
            <tbody>
              {list.items?.map((item, ii) => (
                <tr key={ii} className={ii % 2 === 0 ? 'bg-white' : 'bg-wiki-bg-sidebar'}>
                  {item.image && (
                    <td className="border border-wiki-border p-2 w-20 align-middle text-center">
                      <img src={item.image} alt={item.title} className="w-16 h-16 object-cover mx-auto border border-wiki-border" />
                    </td>
                  )}
                  <td className="border border-wiki-border p-2 align-top" colSpan={item.image ? 1 : 2}>
                    {item.title && <p className="font-semibold text-wiki-charcoal">{item.title}</p>}
                    {item.description && <p className="text-wiki-text-muted text-xs mt-0.5">{item.description}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
