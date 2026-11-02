import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

const AuthContext = createContext(null)

// Autenticação exclusivamente via Google (Firebase Auth).
function fromFirebaseUser(firebaseUser) {
  if (!firebaseUser) return null
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    authProvider: 'google',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(fromFirebaseUser(u))
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL

  const loginGoogle = () => signInWithPopup(auth, googleProvider)

  const logout = () => firebaseSignOut(auth)

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
