import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, serverTimestamp, limit
} from 'firebase/firestore'
import { db } from './firebase'

export const CATEGORIES = [
  'characters',
  'stories',
  'geography',
  'cities',
  'states',
  'countries',
  'government',
  'companies',
  'infrastructure',
  'civilizations',
]

export const CATEGORY_LABELS = {
  characters: 'Personagens',
  stories: 'Histórias',
  geography: 'Geografia',
  cities: 'Cidades',
  states: 'Estados',
  countries: 'Países',
  government: 'Governo',
  companies: 'Empresas',
  infrastructure: 'Infraestrutura',
  civilizations: 'Civilizações',
}

export const CATEGORY_ICONS = {
  characters: '👤',
  stories: '📖',
  geography: '🌍',
  cities: '🏙️',
  states: '🗾',
  countries: '🚩',
  government: '🏛️',
  companies: '🏢',
  infrastructure: '⚙️',
  civilizations: '🏺',
}

export const CATEGORY_COLORS = {
  characters: 'amber',
  stories: 'purple',
  geography: 'teal',
  cities: 'blue',
  states: 'green',
  countries: 'red',
  government: 'indigo',
  companies: 'orange',
  infrastructure: 'gray',
  civilizations: 'yellow',
}

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
