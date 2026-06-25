import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { retrieveAndClearCodeVerifier, retrieveAndClearState } from '../lib/focusOAuth'

export default function FocusCallback() {
  const navigate = useNavigate()
  const { setFocusUser } = useAuth()
  const [error, setError] = useState(null)

  // React.StrictMode (ativo em dev, ver src/main.jsx) roda efeitos duas vezes de
  // propósito, para ajudar a pegar efeitos colaterais não limpos. Sem essa guarda,
  // a segunda execução tentaria trocar o MESMO code de novo — e como o code é de
  // uso único (e o code_verifier já foi removido do sessionStorage na 1ª leitura),
  // a segunda chamada sempre falharia com invalid_grant. Isso não acontece em
  // produção (StrictMode não duplica efeitos em build de produção), mas precisa
  // ser tratado para funcionar local em dev.
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      const oauthError = params.get('error')

      if (oauthError === 'access_denied') {
        setError('Login com Focus cancelado.')
        return
      }

      const expectedState = retrieveAndClearState()
      if (!code || !state || state !== expectedState) {
        setError('Não foi possível validar o login. Tente novamente.')
        return
      }

      const verifier = retrieveAndClearCodeVerifier()
      if (!verifier) {
        setError('Sessão de login expirou. Tente novamente.')
        return
      }

      try {
        const response = await fetch('/api/auth/focus/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, codeVerifier: verifier }),
        })

        if (!response.ok) {
          setError('Não foi possível completar o login.')
          return
        }

        const data = await response.json()
        setFocusUser(data.user)
        navigate('/')
      } catch {
        setError('Não foi possível conectar ao servidor.')
      }
    }

    handleCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-wiki-bg-main flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-wiki-text mb-3">{error}</p>
          <a href="/login" className="wiki-link text-sm">
            Voltar para o login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wiki-bg-main flex items-center justify-center p-4">
      <p className="text-wiki-text-muted text-sm">Entrando com Focus Account...</p>
    </div>
  )
}
