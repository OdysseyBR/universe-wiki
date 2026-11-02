import { useEffect, useState } from 'react'
import {
  collection, doc, getDoc, setDoc, deleteDoc,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Universos fixos (fallback) ──────────────────────────────────────────────
// O documento no Firestore usa o MESMO id abaixo, então uma cópia salva
// apenas sobrescreve o label (override), sem duplicar a entrada.

export const DEFAULT_UNIVERSES = [
  { id: 'geral',     label: 'Universo Geral' },
  { id: 'vaha',      label: 'Universo Vaha' },
  { id: 'vasoria',   label: 'Universo de Vasória' },
  { id: 'blackwood', label: 'Universos de Blackwood' },
  { id: 'arka',      label: 'Universo de Arka' },
]

// ─── Util ────────────────────────────────────────────────────────────────────

export function slugifyUniverse(label) {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Assinatura em tempo real ────────────────────────────────────────────────
// Mesmo padrão de subscribeToCategorias: universos padrão vêm do código e
// qualquer documento salvo no Firestore sobrescreve (ou cria um novo custom).

export function subscribeToUniverses(callback) {
  return onSnapshot(collection(db, 'universes'), snap => {
    const saved = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    const defaults = DEFAULT_UNIVERSES.map(d => {
      const override = saved.find(s => s.id === d.id)
      return { ...d, ...(override || {}), id: d.id, custom: false }
    })

    const custom = saved
      .filter(s => !DEFAULT_UNIVERSES.some(d => d.id === s.id))
      .map(s => ({ ...s, custom: true }))
      .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))

    callback([...defaults, ...custom])
  })
}

export function useUniverses() {
  const [universes, setUniverses] = useState(DEFAULT_UNIVERSES)
  useEffect(() => subscribeToUniverses(setUniverses), [])
  return universes
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createUniverse({ id, label }) {
  // Colide com um padrão do código? O documento pode nem existir no
  // Firestore (defaults são só código), então o getDoc sozinho não basta.
  if (DEFAULT_UNIVERSES.some(d => d.id === id)) {
    throw new Error('Já existe um universo padrão com este nome.')
  }
  const ref = doc(db, 'universes', id)
  const snap = await getDoc(ref)
  if (snap.exists()) throw new Error('Já existe um universo com este id.')
  await setDoc(ref, { label, createdAt: serverTimestamp() })
}

export async function updateUniverse(id, data) {
  // setDoc com merge cria o documento se não existir — é assim que um
  // universo padrão ganha uma edição (override) salva no Firestore.
  await setDoc(doc(db, 'universes', id), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteUniverse(id) {
  await deleteDoc(doc(db, 'universes', id))
}

// ─── Labels ──────────────────────────────────────────────────────────────────
// `universes` é a lista vinda do hook; sem ela, cai nos padrões do código.

export function getUniverseLabel(id, universes = DEFAULT_UNIVERSES) {
  const u = universes.find(x => x.id === id)
  return u ? u.label : null
}
