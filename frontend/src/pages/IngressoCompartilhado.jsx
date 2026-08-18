import { useEffect, useState } from 'react'
import api from '../services/api'
import { QRCodeSVG } from 'qrcode.react'

const IMG_BASE = 'https://image.tmdb.org/t/p/w500'

export default function IngressoCompartilhado() {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const token = window.location.pathname.split('/')[2]
    api.get(`/tickets/share/${token}`)
      .then((r) => setDados(r.data))
      .catch(() => setErro('Ingresso não encontrado ou link inválido.'))
      .finally(() => setCarregando(false))
  }, [])

  if (carregando) return <div className="container empty-state">Carregando...</div>
  if (erro) return <div className="container empty-state">{erro}</div>

  return (
    <div className="container" style={{ maxWidth: '620px', textAlign: 'center' }}>
      <div className="page-header">
        <h1>Ingresso compartilhado</h1>
        <p>Este é o ingresso que você recebeu. Use o QR Code na entrada do evento.</p>
      </div>
      <div className="card card-padding" style={{ display: 'inline-block', textAlign: 'left', minWidth: '320px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <QRCodeSVG value={dados.codigo} size={140} />
          <div>
            <h2>{dados.evento_titulo}</h2>
            <p className="event-meta">Assento: <strong>{dados.assento}</strong></p>
            <span className={`ticket-status ${dados.status}`}>{dados.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}