import {
  Users, BookOpen, Globe, Building2, Map, MapPin, Flag, Landmark,
  Briefcase, Cog, Settings, Factory, Castle, Scroll, Swords, Shield,
  Crown, Mountain, Waves, Flame, Snowflake, Zap, Moon, Sun, Star,
  Anchor, Feather, Compass, Home, Banknote, Gavel, Scale, Train,
  Plane, Ship, Rocket, Palette, Music, Trophy, Target, Lightbulb,
  Key, Radio, Coins, TrendingUp, FlaskConical, Atom, Gem, Hammer,
  Library, TreePine, Crosshair, Eye,
} from 'lucide-react'

// Registro de ícones: chave (string, salva no Firestore) → componente lucide.
export const ICONS = {
  'users': Users,
  'book-open': BookOpen,
  'globe': Globe,
  'building-2': Building2,
  'building': Building2,
  'map': Map,
  'map-pin': MapPin,
  'flag': Flag,
  'landmark': Landmark,
  'briefcase': Briefcase,
  'cog': Cog,
  'settings': Settings,
  'factory': Factory,
  'castle': Castle,
  'scroll': Scroll,
  'swords': Swords,
  'shield': Shield,
  'crown': Crown,
  'mountain': Mountain,
  'waves': Waves,
  'flame': Flame,
  'snowflake': Snowflake,
  'zap': Zap,
  'moon': Moon,
  'sun': Sun,
  'star': Star,
  'anchor': Anchor,
  'feather': Feather,
  'compass': Compass,
  'home': Home,
  'banknote': Banknote,
  'gavel': Gavel,
  'scale': Scale,
  'train': Train,
  'plane': Plane,
  'ship': Ship,
  'rocket': Rocket,
  'palette': Palette,
  'music': Music,
  'trophy': Trophy,
  'target': Target,
  'lightbulb': Lightbulb,
  'key': Key,
  'radio': Radio,
  'coins': Coins,
  'trending-up': TrendingUp,
  'flask': FlaskConical,
  'atom': Atom,
  'gem': Gem,
  'hammer': Hammer,
  'library': Library,
  'tree': TreePine,
  'crosshair': Crosshair,
  'eye': Eye,
}

// Opções exibidas no seletor de ícones (ManageCategories / CategoryModal).
export const ICON_OPTIONS = [
  'users', 'book-open', 'globe', 'building-2', 'map', 'flag', 'landmark',
  'briefcase', 'cog', 'factory', 'castle', 'scroll', 'swords', 'shield',
  'crown', 'mountain', 'waves', 'flame', 'snowflake', 'zap', 'moon', 'sun',
  'star', 'anchor', 'feather', 'compass', 'home', 'banknote', 'gavel',
  'scale', 'train', 'plane', 'ship', 'rocket', 'palette', 'music', 'trophy',
  'target', 'lightbulb', 'key', 'radio', 'coins', 'trending-up', 'flask',
  'atom', 'gem', 'hammer', 'library', 'tree', 'eye',
]

// Renderiza o ícone de uma categoria. Aceita tanto a chave nova (lucide)
// quanto um emoji antigo salvo no Firestore (fallback), garantindo
// compatibilidade com dados já existentes.
export function CategoryIcon({ name, size = 14, className = '' }) {
  const Icon = ICONS[name]
  if (Icon) {
    return <Icon size={size} className={className} />
  }
  // Fallback: valor não mapeado (ex: emoji antigo de categoria customizada).
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
      {name || '📄'}
    </span>
  )
}
