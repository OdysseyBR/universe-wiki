import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, serverTimestamp, limit, onSnapshot
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Categorias fixas (fallback) ─────────────────────────────────────────────
// O campo `icon` guarda uma CHAVE de ícone (mapeada em lib/categoryIcons.js
// para um componente lucide), não mais um emoji.

export const DEFAULT_CATEGORIES = [
  { id: 'characters', label: 'Personagens', icon: 'users' },
  { id: 'stories',    label: 'Histórias',   icon: 'book-open' },
  { id: 'geography',  label: 'Geografia',   icon: 'globe' },
  { id: 'cities',     label: 'Cidades',     icon: 'building-2' },
  { id: 'states',     label: 'Estados',     icon: 'map' },
  { id: 'countries',  label: 'Países',      icon: 'flag' },
  { id: 'government', label: 'Governo',     icon: 'landmark' },
  { id: 'companies',  label: 'Empresas',    icon: 'briefcase' },
  { id: 'infrastructure', label: 'Infraestrutura', icon: 'cog' },
  { id: 'civilizations',  label: 'Civilizações',   icon: 'castle' },
]

// Mantidos para compatibilidade com código existente
export const CATEGORIES        = DEFAULT_CATEGORIES.map(c => c.id)
export const CATEGORY_LABELS   = Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.id, c.label]))
export const CATEGORY_ICONS    = Object.fromEntries(DEFAULT_CATEGORIES.map(c => [c.id, c.icon]))

// ─── Categorias customizadas ──────────────────────────────────────────────────

export async function createCategory(data) {
  return addDoc(collection(db, 'categories'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function getCustomCategories() {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('createdAt')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getAllCategories() {
  const custom = await getCustomCategories()
  return [...DEFAULT_CATEGORIES, ...custom]
}

export function subscribeToCategorias(callback) {
  return onSnapshot(
    query(collection(db, 'categories'), orderBy('createdAt')),
    snap => {
      const saved = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // Sobrepõe categorias padrão com versões editadas salvas no Firestore
      const savedIds = new Set(saved.map(c => c.id))
      const defaults = DEFAULT_CATEGORIES
        .filter(c => !savedIds.has(c.id))
        .map(c => ({ ...c, custom: false }))
      const customOnly = saved.filter(c => !DEFAULT_CATEGORIES.find(d => d.id === c.id))
      const overrides  = saved.filter(c => DEFAULT_CATEGORIES.find(d => d.id === c.id))
      const mergedDefaults = DEFAULT_CATEGORIES.map(d => {
        const override = overrides.find(o => o.id === d.id)
        return override ? { ...d, ...override } : { ...d, custom: false }
      })
      callback([...mergedDefaults, ...customOnly.map(c => ({ ...c, custom: true }))])
    }
  )
}

// ─── Artigos ──────────────────────────────────────────────────────────────────

export async function createArticle(data) {
  return addDoc(collection(db, 'articles'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateArticle(id, data) {
  return updateDoc(doc(db, 'articles', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteArticle(id) {
  return deleteDoc(doc(db, 'articles', id))
}

export async function getArticle(id) {
  const snap = await getDoc(doc(db, 'articles', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getArticlesByCategory(category) {
  const q = query(
    collection(db, 'articles'),
    where('category', '==', category),
    orderBy('title')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getAllArticles() {
  const q = query(collection(db, 'articles'), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getRecentArticles(n = 8) {
  const q = query(collection(db, 'articles'), orderBy('updatedAt', 'desc'), limit(n))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function searchArticles(term) {
  const all = await getAllArticles()
  const t = term.toLowerCase()
  return all.filter(a =>
    a.title?.toLowerCase().includes(t) ||
    a.summary?.toLowerCase().includes(t) ||
    (a.tags || []).some(tag => tag.toLowerCase().includes(t))
  )
}

export async function getArticleByTitle(title) {
  const all = await getAllArticles()
  return all.find(a => a.title?.toLowerCase() === title.toLowerCase()) || null
}
