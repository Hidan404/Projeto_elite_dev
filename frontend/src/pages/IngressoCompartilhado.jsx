import { useEffect, useState } from 'react'
import api from '../services/api'
import { QRCodeSVG } from 'qrcode.react'

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
    <div className="container" style={{ maxWidth: '620px' }}>
      <div className="page-header">
        <h1>Ingresso compartilhado</h1>
        <p>Este é o ingresso que você recebeu. Use o QR Code na entrada do evento.</p>
      </div>
      <div className="ticket">
        <div className="ticket-stub">
          <div className="ticket-qr">
            <QRCodeSVG value={dados.codigo} size={130} />
          </div>
          <div className="ticket-info">
            <h3>{dados.evento_titulo}</h3>
            <p className="event-meta">Assento: <strong>{dados.assento}</strong></p>
            <span className={`ticket-status ${dados.status}`}>{dados.status}</span>
          </div>
        </div>
        <div className="ticket-rip" aria-hidden="true" />
      </div>
    </div>
  )
}