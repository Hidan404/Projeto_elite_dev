import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <Logo claro />
          </Link>
          <p>Sua sessão começa aqui — escolha o filme, marque o assento e aproveite o cinema.</p>
        </div>
        <nav className="footer-col" aria-label="Navegação">
          <h4>Navegação</h4>
          <Link to="/">Eventos</Link>
          <Link to="/login">Entrar</Link>
          <Link to="/registro">Criar conta</Link>
          <Link to="/meus-ingressos">Meus ingressos</Link>
        </nav>
        <nav className="footer-col" aria-label="Para o time">
          <h4>Para o time</h4>
          <Link to="/painel">Painel do organizador</Link>
          <Link to="/portaria">Portaria</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© 2026 CineElite — Desafio Elite Dev</span>
          <span className="footer-tech">React · FastAPI · PostgreSQL</span>
        </div>
      </div>
    </footer>
  )
}