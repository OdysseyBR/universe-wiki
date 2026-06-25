import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, googleProvider, githubProvider } from '../lib/firebase'

const AuthContext = createContext(null)

// Shape unificado de usuário, independente do provedor:
// { uid, displayName, email, photoURL, authProvider }
//
// Google e GitHub continuam vindo do Firebase Auth nativo (sem mudança de
// comportamento). Focus Account é uma sessão PRÓPRIA (JWT da wiki, cookie
// httpOnly), verificada via GET /api/auth/focus/me — por isso o estado de
// "qual provedor está logado agora" precisa ser controlado manualmente aqui,
// em vez de depender só do onAuthStateChanged (que só sabe sobre Firebase Auth).

function fromFirebaseUser(firebaseUser, provider) {
  if (!firebaseUser) return null
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    authProvider: provider,
  }
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [focusUser, setFocusUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [focusChecked, setFocusChecked] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Checa a sessão do Focus Account uma vez, ao montar — é uma sessão própria
  // (cookie httpOnly), não passa pelo onAuthStateChanged do Firebase.
  useEffect(() => {
    fetch('/api/auth/focus/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setFocusUser({ ...data.user, authProvider: 'focus' })
      })
      .finally(() => setFocusChecked(true))
  }, [])

  // Prioriza a sessão que existir — na prática, só uma das duas deveria existir
  // por vez (a tela de Login navega para fora assim que detecta `user`).
  const user = focusUser ?? fromFirebaseUser(firebaseUser, googleOrGithubProvider(firebaseUser))

  function googleOrGithubProvider(firebaseUser) {
    if (!firebaseUser) return null
    const providerId = firebaseUser.providerData?.[0]?.providerId
    if (providerId === 'google.com') return 'google'
    if (providerId === 'github.com') return 'github'
    return 'unknown'
  }

  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL

  const loginGoogle = () => signInWithPopup(auth, googleProvider)
  const loginGithub = () => signInWithPopup(auth, githubProvider)

  async function logout() {
    if (focusUser) {
      await fetch('/api/auth/focus/logout', { method: 'POST' })
      setFocusUser(null)
    }
    if (firebaseUser) {
      await firebaseSignOut(auth)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading: loading || !focusChecked,
        loginGoogle,
        loginGithub,
        logout,
        setFocusUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
