import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import EventCard from '../components/EventCard'

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

  return (
    <div className="container">
      <div className="home-header">
        <h1>Filmes em cartaz</h1>
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
        <div className="empty-state">Carregando eventos...</div>
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
  )
}