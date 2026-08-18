import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)
  const headerRef = useRef(null)

  const fecharMenu = () => setMenuAberto(false)

  useEffect(() => {
    const handleClickFora = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) fecharMenu()
    }
    document.addEventListener('click', handleClickFora)
    return () => document.removeEventListener('click', handleClickFora)
  }, [])

  const handleLogout = () => {
    logout()
    fecharMenu()
    navigate('/')
  }

  return (
    <header className="navbar" ref={headerRef}>
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={fecharMenu}>
          <Logo />
        </Link>
        <button
          className="nav-toggle"
          onClick={() => setMenuAberto((m) => !m)}
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={`nav-links ${menuAberto ? 'open' : ''}`}>
          <Link to="/" onClick={fecharMenu}>Eventos</Link>
          {user?.role === 'cliente' && <Link to="/meus-ingressos" onClick={fecharMenu}>Meus ingressos</Link>}
          {user?.role === 'organizador' && <Link to="/painel" onClick={fecharMenu}>Painel</Link>}
          {user?.role === 'portaria' && <Link to="/portaria" onClick={fecharMenu}>Portaria</Link>}
          {user ? (
            <>
              <span className="nav-user">{user.email}</span>
              <button onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={fecharMenu}>Entrar</Link>
              <Link to="/registro" onClick={fecharMenu}>Criar conta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}