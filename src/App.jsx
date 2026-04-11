import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Category from './pages/Category'
import Article from './pages/Article'
import ArticleEditor from './pages/ArticleEditor'
import Search from './pages/Search'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return null
  return isAdmin ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="category/:cat" element={<Category />} />
        <Route path="article/:id" element={<Article />} />
        <Route path="search" element={<Search />} />
        <Route path="new" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
        <Route path="edit/:id" element={<ProtectedRoute><ArticleEditor /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}
