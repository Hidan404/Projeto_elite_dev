import { Link } from 'react-router-dom'

const IMG_BASE = 'https://image.tmdb.org/t/p/w400'

export default function EventCard({ evento }) {
  const data = new Date(evento.data).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  const preco = Number(evento.preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <article className="card event-card">
      <div className="event-cover">
        <img
          src={evento.poster_path ? `${IMG_BASE}${evento.poster_path}` : 'https://placehold.co/400x200?text=Filme'}
          alt={evento.titulo}
        />
      </div>
      <div className="event-body">
        <h3>{evento.titulo}</h3>
        <p className="event-meta">📅 {data}</p>
        <p className="event-meta">📍 {evento.local}</p>
        <div className="event-footer">
          <span className="event-price">{preco}</span>
          <Link to={`/eventos/${evento.id}`} className="btn btn-sm">
            Reservar
          </Link>
        </div>
      </div>
    </article>
  )
}