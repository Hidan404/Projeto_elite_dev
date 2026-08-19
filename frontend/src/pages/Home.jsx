import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import EventCard from '../components/EventCard'

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'

function SkeletonCard() {
  return (
    <div className="card event-card skeleton-card">
      <div className="skeleton skeleton-img" />
      <div className="event-body">
        <div className="skeleton skeleton-line" style={{ width: '70%' }} />
        <div className="skeleton skeleton-line" style={{ width: '50%' }} />
        <div className="skeleton skeleton-line" style={{ width: '60%' }} />
        <div className="skeleton skeleton-btn" />
      </div>
    </div>
  )
}

export default function Home() {
  const [eventos, setEventos] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const buscar = useCallback(() => {
    api
      .get('/events')
      .then((r) => setEventos(r.data))
      .catch(() => setErro('Não foi possível carregar os eventos. O servidor pode estar iniciando (leva ~1 min).'))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    buscar()
  }, [buscar])

  const carregar = () => {
    setCarregando(true)
    setErro('')
    buscar()
  }

  const filtrados = eventos.filter((e) =>
    e.titulo.toLowerCase().includes(busca.toLowerCase()),
  )

  const destaque = !busca ? eventos[0] : null
  const destaquePreco = destaque
    ? Number(destaque.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : ''
  const destaqueData = destaque
    ? new Date(destaque.data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <div>
      {destaque && (
        <section
          className="hero"
          style={destaque.backdrop_path ? { backgroundImage: `url(${BACKDROP_BASE}${destaque.backdrop_path})` } : undefined}
        >
          <div className="hero-overlay" />
          <div className="container hero-content">
            <span className="hero-badge">Destaque da semana</span>
            <h1 className="hero-title">{destaque.titulo}</h1>
            <p className="hero-sinopse">{destaque.sinopse}</p>
            <p className="hero-meta">📅 {destaqueData} · 📍 {destaque.local}</p>
            <div className="hero-footer">
              <span className="hero-price">{destaquePreco}</span>
              <Link to={`/eventos/${destaque.id}`} className="btn btn-lg">
                Reservar ingresso
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="container">
        <div className="home-header">
          <h2>Filmes em cartaz</h2>
          <p>Escolha um filme, selecione seus assentos e garanta seu ingresso.</p>
        </div>

        <div className="search-bar">
          <input
            className="input"
            placeholder="Buscar filme pelo nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {carregando ? (
          <div className="grid" aria-label="Carregando eventos">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : erro ? (
          <div className="empty-state">
            <h3>Ops, algo deu errado</h3>
            <p>{erro}</p>
            <button className="btn mt-md" onClick={carregar}>Tentar novamente</button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum evento encontrado</h3>
            <p>Tente outra busca ou volte mais tarde.</p>
          </div>
        ) : (
          <div className="grid">
            {filtrados.map((e) => (
              <EventCard key={e.id} evento={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}