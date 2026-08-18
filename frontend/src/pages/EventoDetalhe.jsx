import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import SeatMap from '../components/SeatMap'

const IMG_BASE = 'https://image.tmdb.org/t/p/w500'

export default function EventoDetalhe() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [evento, setEvento] = useState(null)
  const [selecionados, setSelecionados] = useState([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((r) => setEvento(r.data))
      .catch(() => setErro('Evento não encontrado'))
      .finally(() => setCarregando(false))
  }, [id])

  const toggleSeat = (seatId) => {
    setSelecionados((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId],
    )
  }

  const reservar = async () => {
    setErro('')
    try {
      const { data } = await api.post(`/events/${id}/reserve`, {
        assentos: selecionados,
      })
      navigate(`/checkout/${data.id}`, { state: { evento, reserva: data } })
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao reservar assentos.')
    }
  }

  if (carregando) return <div className="container empty-state">Carregando...</div>
  if (erro && !evento) return <div className="container empty-state">{erro}</div>

  const precoTotal = Number(evento.preco) * selecionados.length

  return (
    <div className="container">
      <div className="detail-layout">
        <img
          className="detail-poster"
          src={evento.poster_path ? `${IMG_BASE}${evento.poster_path}` : 'https://placehold.co/300x450?text=Filme'}
          alt={evento.titulo}
        />
        <div className="detail-body">
          <h1>{evento.titulo}</h1>
          <p className="detail-meta">
            {new Date(evento.data).toLocaleString('pt-BR')} · {evento.local}
          </p>
          <p className="detail-sinopse">{evento.sinopse}</p>
          <p>
            <strong>Preço por assento:</strong>{' '}
            {Number(evento.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="card card-padding mb-lg">
        <h2 className="mb-md">Selecione seus assentos</h2>
        {!user ? (
          <div className="empty-state">
            <h3>Você precisa entrar para reservar</h3>
            <button className="btn" onClick={() => navigate('/login')}>Entrar</button>
          </div>
        ) : (
          <>
            <SeatMap seats={evento.seats} selected={selecionados} onSelect={toggleSeat} />
            {erro && <div className="form-error mt-md">{erro}</div>}
            {selecionados.length > 0 && (
              <div className="seat-bar">
                <span>
                  <strong>{selecionados.length}</strong> assento(s) ·{' '}
                  <strong>
                    {precoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </span>
                <button className="btn" onClick={reservar}>Reservar assentos</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}