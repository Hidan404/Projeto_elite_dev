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
      setTimeout(() => setCopiado(null), 2500)
    } catch {
      alert(url)
    }
  }

  const copiarCodigo = async (codigo) => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(`codigo-${codigo.slice(0, 12)}`)
      setTimeout(() => setCopiado(null), 2500)
    } catch {
      alert(codigo)
    }
  }

  const formatarData = (data) => {
    if (!data) return ''
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
        <div className="flex-col" style={{ gap: '16px' }}>
          {ingressos.map((t) => (
            <div key={t.id} className="ticket">
              <div className="ticket-stub">
                <div className="ticket-qr">
                  <QRCodeSVG value={t.codigo} size={130} />
                </div>
                <div className="ticket-info">
                  <h3>{t.evento_titulo}</h3>
                  <p className="event-meta">Assento: <strong>{t.assento}</strong></p>
                  {t.evento_data && <p className="event-meta">📅 {formatarData(t.evento_data)}</p>}
                  {t.evento_local && <p className="event-meta">📍 {t.evento_local}</p>}
                  <span className={`ticket-status ${t.status}`}>
                    {t.status === 'ativo' ? 'Válido' : t.status}
                  </span>
                </div>
              </div>
              <div className="ticket-rip" aria-hidden="true" />
              <div className="ticket-stub" style={{ flex: '0 0 auto' }}>
                <div className="ticket-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => compartilhar(t.share_token)}>
                    {copiado === t.share_token ? '✓ Link copiado!' : 'Compartilhar'}
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => copiarCodigo(t.codigo)}>
                    {copiado === `codigo-${t.codigo.slice(0, 12)}` ? '✓ Código copiado!' : 'Copiar código'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}