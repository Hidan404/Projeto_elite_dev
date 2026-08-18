import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import api from '../services/api'

export default function MeusIngressos() {
  const [ingressos, setIngressos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [copiado, setCopiado] = useState(null)

  useEffect(() => {
    api.get('/tickets/mine')
      .then((r) => setIngressos(r.data))
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  const compartilhar = async (token) => {
    const url = `${window.location.origin}/ingresso/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(token)
      setTimeout(() => setCopiado(null), 2000)
    } catch {
      alert(url)
    }
  }

  if (carregando) return <div className="container empty-state">Carregando...</div>

  return (
    <div className="container">
      <div className="page-header">
        <h1>Meus ingressos</h1>
        <p>Apresente o QR Code na entrada do evento. Para transferir, compartilhe o link.</p>
      </div>

      {ingressos.length === 0 ? (
        <div className="empty-state">
          <h3>Você ainda não tem ingressos</h3>
          <p>Escolha um filme em <a href="/">Eventos</a> e garanta seu lugar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {ingressos.map((t) => (
            <div key={t.id} className="ticket">
              <QRCodeSVG value={t.codigo} size={120} />
              <div className="ticket-info">
                <h3>{t.evento_titulo}</h3>
                <p className="event-meta">Assento: <strong>{t.assento}</strong></p>
                <span className={`ticket-status ${t.status}`}>{t.status}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => compartilhar(t.share_token)}>
                  {copiado === t.share_token ? 'Link copiado!' : 'Compartilhar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}