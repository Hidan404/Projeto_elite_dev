import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Checkout() {
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const evento = state?.evento
  const reserva = state?.reserva
  const reservaId = pathname.split('/')[2]
  const quantidade = reserva?.assentos?.length || 0
  const total = Number(evento?.preco || 0) * quantidade

  const [numero, setNumero] = useState('')
  const [validade, setValidade] = useState('')
  const [cvv, setCvv] = useState('')
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)

  if (!evento || !reserva) {
    return <div className="container empty-state">Reserva não encontrada. Volte e selecione seus assentos.</div>
  }

  const pagar = async (e) => {
    e.preventDefault()
    setErro('')
    setProcessando(true)
    try {
      const { data } = await api.post(`/reservations/${reservaId}/pay`, {
        numero_cartao: numero,
        validade,
        cvv,
      })
      navigate('/meus-ingressos', { state: { ingressos: data } })
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro no pagamento. Tente novamente.')
      setProcessando(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: '720px' }}>
      <div className="page-header">
        <h1>Pagamento</h1>
        <p>Simulação de pagamento — use um cartão 4242 para aprovar, qualquer outro para recusar.</p>
      </div>

      <div className="card card-padding mb-lg">
        <h2 className="mb-sm">Resumo</h2>
        <div className="summary-row"><span>{evento.titulo}</span><span>{evento.local}</span></div>
        <div className="summary-row"><span>Assentos reservados</span><span>{reserva.assentos.join(', ')}</span></div>
        <div className="summary-row"><span>Preço por assento</span><span>{Number(evento.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
        <div className="summary-row summary-total"><span>Total ({quantidade} ingresso{quantidade > 1 ? 's' : ''})</span><span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
      </div>

      {erro && <div className="form-error">{erro}</div>}

      <form onSubmit={pagar} className="card card-padding">
        <div className="form-group">
          <label htmlFor="numero">Número do cartão</label>
          <input
            id="numero"
            className="input"
            placeholder="4242 4242 4242 4242"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="validade">Validade</label>
            <input id="validade" className="input" placeholder="12/30" value={validade} onChange={(e) => setValidade(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="cvv">CVV</label>
            <input id="cvv" className="input" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} required />
          </div>
        </div>
        <button type="submit" className="btn btn-block" disabled={processando}>
          {processando ? 'Processando...' : 'Pagar agora'}
        </button>
      </form>
    </div>
  )
}