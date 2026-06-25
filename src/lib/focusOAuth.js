// PKCE do lado do client (frontend da wiki). Gera o par verifier/challenge
// localmente e guarda o verifier em sessionStorage até o /callback voltar.

const STORAGE_KEY = 'focus_oauth_code_verifier'
const STATE_KEY = 'focus_oauth_state'

function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function generatePkcePair() {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  const verifier = base64url(randomBytes.buffer)

  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier))
  const challenge = base64url(digest)

  return { verifier, challenge }
}

export function storeCodeVerifier(verifier) {
  sessionStorage.setItem(STORAGE_KEY, verifier)
}

export function retrieveAndClearCodeVerifier() {
  const verifier = sessionStorage.getItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
  return verifier
}

export function storeState(state) {
  sessionStorage.setItem(STATE_KEY, state)
}

export function retrieveAndClearState() {
  const state = sessionStorage.getItem(STATE_KEY)
  sessionStorage.removeItem(STATE_KEY)
  return state
}

function randomState() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Configuração do client. Em dev local, troque FOCUS_ACCOUNT_URL para
// http://localhost:3000 (onde o accounts-focus roda) via .env.local:
//   VITE_FOCUS_ACCOUNT_URL=http://localhost:3000
const FOCUS_ACCOUNT_URL = import.meta.env.VITE_FOCUS_ACCOUNT_URL || 'https://accountsfocus.xyz'
const CLIENT_ID = 'focusverse-wiki'
const SCOPE = 'profile email'

// Chamado pelo botão "Entrar com Focus" em Login.jsx.
export async function startFocusLogin() {
  const { verifier, challenge } = await generatePkcePair()
  storeCodeVerifier(verifier)

  const state = randomState()
  storeState(state)

  const redirectUri = `${window.location.origin}/auth/focus/callback`

  const url = new URL(`${FOCUS_ACCOUNT_URL}/api/oauth/authorize`)
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', state)
  url.searchParams.set('scope', SCOPE)

  window.location.href = url.toString()
}
