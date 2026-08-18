import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <Logo />
        </Link>
        <nav className="nav-links">
          <Link to="/">Eventos</Link>
          {user?.role === 'cliente' && <Link to="/meus-ingressos">Meus ingressos</Link>}
          {user?.role === 'organizador' && <Link to="/painel">Painel</Link>}
          {user?.role === 'portaria' && <Link to="/portaria">Portaria</Link>}
          {user ? (
            <>
              <span className="nav-user">{user.email}</span>
              <button onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <>
              <Link to="/login">Entrar</Link>
              <Link to="/registro">Criar conta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}