import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToCategorias } from '../lib/db'
import { Search, Plus, LogOut, LogIn, Menu, X, BookOpen, User } from 'lucide-react'

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
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-ink-900 border-r border-ink-800/60 z-30
        transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="p-5 border-b border-ink-800/60">
          <Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen size={16} className="text-ink-950" />
            </div>
            <div>
              <div className="font-display font-bold text-ink-50 leading-tight">Universe</div>
              <div className="font-mono text-xs text-amber-500 leading-tight">Wiki</div>
            </div>
          </Link>
          <button className="absolute top-4 right-4 text-ink-500 hover:text-ink-300 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-ink-800/60">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type="text"
                placeholder="Buscar... ou #tag"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-ink-800/60 border border-ink-700/50 rounded-lg pl-9 pr-3 py-2 text-sm text-ink-200 placeholder-ink-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </form>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="text-xs font-mono text-ink-600 uppercase tracking-wider mb-3">Categorias</div>
          <ul className="space-y-1">
            {categories.map(cat => (
              <li key={cat.id}>
                <NavLink
                  to={`/category/${cat.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150
                    ${isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                      : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800/60'
                    }`
                  }
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-ink-800/60 space-y-2">
          {isAdmin && (
            <Link to="/new" onClick={() => setSidebarOpen(false)} className="btn-primary w-full justify-center">
              <Plus size={15} />
              Novo artigo
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 min-w-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-ink-700 flex items-center justify-center flex-shrink-0">
                    <User size={13} className="text-ink-400" />
                  </div>
                )}
                <span className="text-xs text-ink-400 truncate">{user.displayName || user.email}</span>
              </div>
              <button onClick={logout} className="text-ink-500 hover:text-ink-300 transition-colors flex-shrink-0">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setSidebarOpen(false)} className="btn-ghost w-full justify-center">
              <LogIn size={15} />
              Entrar
            </Link>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-ink-800/60 bg-ink-900/80 sticky top-0 z-10 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-ink-400 hover:text-ink-200">
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
              <BookOpen size={12} className="text-ink-950" />
            </div>
            <span className="font-display font-bold text-ink-50 text-sm">Universe Wiki</span>
          </Link>
          {isAdmin && (
            <Link to="/new" className="ml-auto">
              <Plus size={18} className="text-amber-500" />
            </Link>
          )}
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-5xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
