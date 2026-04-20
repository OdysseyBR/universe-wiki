import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToCategorias } from '../lib/db'
import { useEffect } from 'react'
import { Search, Plus, LogOut, LogIn, Menu, X, BookOpen, User, Shield, ChevronRight } from 'lucide-react'

export default function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = subscribeToCategorias(setCategories)
    return () => unsub()
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header top bar */}
      <header className="bg-wiki-navy border-b border-wiki-navy-dark">
        <div className="max-w-screen-xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <BookOpen size={18} className="text-wiki-gold" />
            <span className="font-sans font-bold text-white text-lg tracking-wide">Universe Wiki</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="flex w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar no wiki..."
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm px-3 py-1.5 rounded-l focus:outline-none focus:bg-white/20"
              />
              <button type="submit" className="bg-wiki-teal hover:bg-wiki-teal-light border border-wiki-teal-dark text-white text-sm px-3 py-1.5 rounded-r transition-colors">
                <Search size={14} />
              </button>
            </div>
          </form>

          {/* User actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full border border-white/30" />
                  : <User size={14} className="text-white/70" />
                }
                <span className="text-white/80 text-xs hidden md:block">{user.displayName}</span>
                {isAdmin && (
                  <Link to="/new" className="bg-wiki-gold text-wiki-charcoal text-xs px-2 py-1 rounded font-semibold hover:opacity-90 transition-opacity flex items-center gap-1">
                    <Plus size={12} /> Novo artigo
                  </Link>
                )}
                <button onClick={logout} className="text-white/60 hover:text-white transition-colors">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-white/80 hover:text-white text-xs flex items-center gap-1 transition-colors">
                <LogIn size={14} /> Entrar
              </Link>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-white/80 hover:text-white">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">

        {/* Sidebar */}
        <aside className={`
          fixed md:static top-0 left-0 h-full md:h-auto z-40 md:z-auto
          w-56 bg-wiki-bg-sidebar border-r border-wiki-border
          flex flex-col flex-shrink-0 overflow-y-auto
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}>
          {/* Mobile close */}
          <div className="md:hidden flex items-center justify-between p-3 border-b border-wiki-border">
            <span className="font-semibold text-wiki-charcoal text-sm">Menu</span>
            <button onClick={() => setSidebarOpen(false)}><X size={18} /></button>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-4">
            {/* Main nav */}
            <div>
              <p className="text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-1 px-2">Navegação</p>
              <ul className="space-y-0.5">
                <li>
                  <Link to="/" onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-wiki-link hover:bg-wiki-silver/40 rounded transition-colors">
                    Página principal
                  </Link>
                </li>
                <li>
                  <Link to="/search" onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-wiki-link hover:bg-wiki-silver/40 rounded transition-colors">
                    Buscar
                  </Link>
                </li>
              </ul>
            </div>

            {/* Categorias */}
            <div>
              <p className="text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-1 px-2">Categorias</p>
              <ul className="space-y-0.5">
                {categories.map(cat => (
                  <li key={cat.id}>
                    <NavLink
                      to={`/category/${cat.id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-1.5 px-2 py-1.5 text-sm rounded transition-colors ${
                          isActive
                            ? 'bg-wiki-navy/10 text-wiki-navy font-semibold border-l-2 border-wiki-navy pl-1.5'
                            : 'text-wiki-link hover:bg-wiki-silver/40'
                        }`
                      }
                    >
                      <span className="text-base leading-none">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Admin */}
            {isAdmin && (
              <div>
                <p className="text-xs font-bold text-wiki-text-muted uppercase tracking-wider mb-1 px-2">Admin</p>
                <ul className="space-y-0.5">
                  <li>
                    <Link to="/new" onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm text-wiki-teal hover:bg-wiki-silver/40 rounded transition-colors font-medium">
                      <Plus size={13} /> Novo artigo
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            {/* Search mobile */}
            <div className="md:hidden">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="flex-1 border border-wiki-border text-sm px-2 py-1.5 rounded-l focus:outline-none focus:border-wiki-navy text-wiki-text bg-white"
                />
                <button type="submit" className="bg-wiki-navy text-white px-2 py-1.5 rounded-r">
                  <Search size={13} />
                </button>
              </form>
            </div>
          </nav>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 bg-white border-r border-wiki-border">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-wiki-bg-sidebar border-t border-wiki-border py-4 text-center">
        <p className="text-xs text-wiki-text-muted">Universe Wiki — O universo literário documentado</p>
      </footer>
    </div>
  )
}
