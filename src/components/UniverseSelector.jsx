import { useUniverses } from '../lib/universes'

export default function UniverseSelector({ value, onChange }) {
  const universes = useUniverses()
  // Se o universo do artigo não existe mais (ex: foi deletado), não cair
  // para o primeiro — senão o box de classificação mentiria.
  const selected  = universes.find(u => u.id === value)

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-2">
          Universo
        </label>
        <div className="flex flex-wrap gap-2">
          {universes.map(u => (
            <button key={u.id} type="button"
              onClick={() => onChange(u.id)}
              className={`px-3 py-1.5 text-sm border rounded transition-all ${
                value === u.id
                  ? 'bg-wiki-navy/10 border-wiki-navy/40 text-wiki-navy font-semibold'
                  : 'border-wiki-border text-wiki-text-muted hover:border-wiki-navy/30 hover:text-wiki-navy'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-wiki-text-muted bg-wiki-bg-sidebar border border-wiki-border px-3 py-2">
        Classificação: <span className="font-semibold text-wiki-charcoal">
          {selected?.label || '—'}
        </span>
      </div>
    </div>
  )
}
