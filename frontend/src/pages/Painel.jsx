import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const IMG_BASE = 'https://image.tmdb.org/t/p/w200'

export default function Painel() {
  const [meusEventos, setMeusEventos] = useState([])
  const [todosEventos, setTodosEventos] = useState([])
  const [buscaTMDb, setBuscaTMDb] = useState('')
  const [resultados, setResultados] = useState([])
  const [form, setForm] = useState({ tmdb_movie_id: 0, data: '', local: '', preco: '' })
  const [erro, setErro] = useState('')
  const [selecionado, setSelecionado] = useState(null)

  const carregar = () => {
    api.get('/events')
      .then((r) => {
        setTodosEventos(r.data)
        const email = JSON.parse(localStorage.getItem('user') || '{}').email
        // Exibe todos; backend não expõe organizador por evento ainda
        setMeusEventos(r.data)
      })
      .catch(() => {})
  }

  useEffect(() => {
    carregar()
  }, [])

  const buscarFilmes = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      const { data } = await api.get('/events/search-tmdb', { params: { query: buscaTMDb } })
      setResultados(data)
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao buscar filmes.')
    }
  }

  const criarEvento = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      await api.post('/events', {
        tmdb_movie_id: form.tmdb_movie_id,
        data: form.data,
        local: form.local,
        preco: form.preco,
      })
      setResultados([])
      setForm({ tmdb_movie_id: 0, data: '', local: '', preco: '' })
      setSelecionado(null)
      carregar()
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar evento.')
    }
  }

  const cancelarEvento = async (id) => {
    if (!window.confirm('Cancelar este evento? Isso só é possível se ele ainda não tiver ingressos vendidos.')) return
    try {
      await api.delete(`/events/${id}`)
      setErro('')
      carregar()
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao cancelar. Este evento não pode ser removido.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Painel do organizador</h1>
        <p>Publique um novo evento a partir do catálogo de filmes ou gerencie os existentes.</p>
      </div>

      {erro && (
        <div className="card card-padding" style={{ borderColor: '#fecaca', background: '#fef2f2', marginBottom: '24px' }}>
          <strong style={{ color: 'var(--danger)' }}>Não foi possível concluir a ação</strong>
          <p style={{ color: 'var(--text)', marginTop: '6px' }}>{erro}</p>
        </div>
      )}

      <div className="card card-padding" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>1. Buscar filme no catálogo</h2>
        <form onSubmit={buscarFilmes} className="search-bar" style={{ marginBottom: 0 }}>
          <input
            className="input"
            placeholder="Nome do filme (vazio = em cartaz)"
            value={buscaTMDb}
            onChange={(e) => setBuscaTMDb(e.target.value)}
          />
          <button type="submit" className="btn">Buscar</button>
        </form>

        {resultados.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {resultados.slice(0, 8).map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                <img src={f.poster_path ? `${IMG_BASE}${f.poster_path}` : 'https://placehold.co/60x90'} alt="" style={{ width: '50px', borderRadius: '6px' }} />
                <div style={{ flex: 1 }}>
                  <strong>{f.titulo}</strong>
                  <p className="event-meta" style={{ fontSize: '0.8rem' }}>ID TMDb: {f.id}</p>
                </div>
                <button type="button" className="btn btn-sm" onClick={() => {
                  setForm((prev) => ({ ...prev, tmdb_movie_id: f.id }))
                  setSelecionado(f)
                }}>
                  Selecionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card card-padding" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>2. Publicar evento</h2>
        <form onSubmit={criarEvento}>
          <div className="form-group">
            <label>Filme selecionado</label>
            {selecionado ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                <img src={selecionado.poster_path ? `${IMG_BASE}${selecionado.poster_path}` : 'https://placehold.co/60x90'} alt="" style={{ width: '50px', borderRadius: '6px' }} />
                <div>
                  <strong>{selecionado.titulo}</strong>
                  <p className="event-meta" style={{ fontSize: '0.8rem' }}>ID TMDb: {selecionado.id}</p>
                </div>
              </div>
            ) : (
              <input className="input" value="" readOnly placeholder="Selecione um filme na busca acima" />
            )}
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Data e hora</label>
              <input type="datetime-local" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Preço (R$)</label>
              <input type="number" step="0.01" min="0.01" className="input" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Local</label>
            <input className="input" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="Ex: Cine Elite — Sala 3" required />
          </div>
          <button type="submit" className="btn" disabled={!form.tmdb_movie_id}>
            Publicar evento
          </button>
        </form>
      </div>

      <div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>Meus eventos</h2>
        {meusEventos.length === 0 ? (
          <div className="empty-state">Nenhum evento publicado ainda.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {meusEventos.map((e) => (
              <div key={e.id} className="card card-padding" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <strong>{e.titulo}</strong>
                  <p className="event-meta" style={{ fontSize: '0.85rem' }}>
                    {new Date(e.data).toLocaleString('pt-BR')} · {e.local} · {Number(e.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to={`/eventos/${e.id}`} className="btn btn-sm btn-secondary">Ver</Link>
                  <button className="btn btn-sm btn-danger" onClick={() => cancelarEvento(e.id)}>Cancelar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}