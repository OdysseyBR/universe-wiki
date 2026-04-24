import { Plus, Trash2, GripVertical } from 'lucide-react'

const ROW_TYPES = [
  { id: 'normal',  label: 'Normal' },
  { id: 'sub',     label: '• Subitem' },
  { id: 'section', label: 'Seção' },
]

const MAX_ROWS = 15

export default function InfoboxEditor({ rows, onChange }) {

  function addRow() {
    if (rows.length >= MAX_ROWS) return
    onChange([...rows, { type: 'normal', label: '', value: '' }])
  }

  function removeRow(i) {
    onChange(rows.filter((_, idx) => idx !== i))
  }

  function updateRow(i, field, value) {
    onChange(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  function moveRow(i, dir) {
    const next = [...rows]
    const target = i + dir
    if (target < 0 || target >= next.length) return
    ;[next[i], next[target]] = [next[target], next[i]]
    onChange(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-wiki-text-muted uppercase tracking-wider">
          Infobox lateral <span className="normal-case font-normal">({rows.length}/{MAX_ROWS} linhas)</span>
        </label>
        <button type="button" onClick={addRow} disabled={rows.length >= MAX_ROWS}
          className="flex items-center gap-1 text-xs text-wiki-teal hover:underline font-medium disabled:opacity-40 disabled:cursor-not-allowed">
          <Plus size={12} /> Adicionar linha
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="border border-dashed border-wiki-border p-4 text-center text-xs text-wiki-text-muted">
          Nenhuma linha ainda. Clique em "Adicionar linha" para começar.
        </div>
      ) : (
        <div className="border border-wiki-border divide-y divide-wiki-border">
          {rows.map((row, i) => (
            <div key={i} className={`flex items-center gap-2 p-2 ${
              row.type === 'section' ? 'bg-wiki-navy/5' : 'bg-white'
            }`}>
              {/* Reordenar */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button type="button" onClick={() => moveRow(i, -1)} disabled={i === 0}
                  className="text-wiki-text-muted hover:text-wiki-navy disabled:opacity-20 leading-none text-xs">▲</button>
                <button type="button" onClick={() => moveRow(i, 1)} disabled={i === rows.length - 1}
                  className="text-wiki-text-muted hover:text-wiki-navy disabled:opacity-20 leading-none text-xs">▼</button>
              </div>

              {/* Tipo */}
              <select value={row.type} onChange={e => updateRow(i, 'type', e.target.value)}
                className="text-xs border border-wiki-border px-1.5 py-1 text-wiki-text bg-white focus:outline-none focus:border-wiki-navy flex-shrink-0 w-24">
                {ROW_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>

              {/* Label */}
              <input
                type="text"
                value={row.label}
                onChange={e => updateRow(i, 'label', e.target.value)}
                placeholder={row.type === 'section' ? 'Título da seção...' : 'Rótulo...'}
                className="flex-1 text-xs border border-wiki-border px-2 py-1 text-wiki-text bg-white focus:outline-none focus:border-wiki-navy"
              />

              {/* Value (não aparece em seção) */}
              {row.type !== 'section' && (
                <input
                  type="text"
                  value={row.value}
                  onChange={e => updateRow(i, 'value', e.target.value)}
                  placeholder="Valor..."
                  className="flex-1 text-xs border border-wiki-border px-2 py-1 text-wiki-text bg-white focus:outline-none focus:border-wiki-navy"
                />
              )}

              {/* Remover */}
              <button type="button" onClick={() => removeRow(i)}
                className="text-wiki-text-muted hover:text-wiki-red transition-colors flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {rows.filter(r => r.label || r.value).length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-wiki-text-muted mb-1">Preview:</p>
          <InfoboxPreview rows={rows} title="Infobox" />
        </div>
      )}
    </div>
  )
}

export function InfoboxPreview({ rows, title, imageUrl }) {
  const validRows = rows.filter(r => r.label || r.value)
  if (validRows.length === 0 && !imageUrl) return null

  return (
    <div className="infobox text-xs" style={{ float: 'none', width: '100%', maxWidth: '300px' }}>
      {title && <div className="infobox-title">{title}</div>}
      {imageUrl && (
        <div className="infobox-image">
          <img src={imageUrl} alt={title} />
        </div>
      )}
      <table className="w-full">
        <tbody>
          {validRows.map((row, i) => {
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
                <td className="px-2 py-1 border border-wiki-border align-top">
                  {row.value}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
