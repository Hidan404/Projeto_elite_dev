import { useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../services/api'

export default function Portaria() {
  const [codigo, setCodigo] = useState('')
  const [eventoId, setEventoId] = useState('')
  const [resultado, setResultado] = useState(null)
  const [modo, setModo] = useState('manual')
  const [erro, setErro] = useState('')
  const [lendo, setLendo] = useState(false)
  const scannerRef = useRef(null)

  const iniciarCamera = async () => {
    setErro('')
    setLendo(true)
    scannerRef.current = new Html5Qrcode('reader')
    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          setCodigo(text)
          setLendo(false)
          scannerRef.current?.stop().then(() => scannerRef.current?.clear()).catch(() => {})
        },
        () => {},
      )
    } catch (e) {
      setErro('Não foi possível acessar a câmera: ' + (e?.message || e))
      setLendo(false)
    }
  }

  const pararCamera = async () => {
    try {
      await scannerRef.current?.stop()
      await scannerRef.current?.clear()
    } catch {}
    scannerRef.current = null
    setLendo(false)
  }

  const validar = async (e) => {
    e.preventDefault()
    setErro('')
    setResultado(null)
    try {
      const { data } = await api.post('/portaria/validate', {
        codigo,
        evento_id: eventoId ? Number(eventoId) : null,
      })
      setResultado(data)
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao validar.')
    }
  }

  return (
    <div className="container" style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <h1>Portaria</h1>
        <p>Valide o ingresso do cliente na entrada. Leia o QR pela câmera ou digite o código.</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        <button className={`btn btn-sm ${modo === 'manual' ? '' : 'btn-secondary'}`} onClick={() => { setModo('manual'); pararCamera() }}>
          Digitar código
        </button>
        <button className={`btn btn-sm ${modo === 'camera' ? '' : 'btn-secondary'}`} onClick={() => { setModo('camera'); iniciarCamera() }}>
          Ler com câmera
        </button>
      </div>

      {modo === 'camera' && (
        <div className="card card-padding" style={{ marginBottom: '20px' }}>
          <div id="reader" style={{ width: '100%' }}></div>
          {lendo && <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>Aguardando QR Code...</p>}
          {codigo && (
            <>
              <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Código lido: {codigo.slice(0, 40)}...
              </p>
              <button className="btn btn-sm btn-secondary" style={{ marginTop: '10px' }} onClick={pararCamera}>
                Ler outro
              </button>
            </>
          )}
        </div>
      )}

      {erro && <div className="form-error">{erro}</div>}

      <form onSubmit={validar} className="card card-padding">
        <div className="form-group">
          <label htmlFor="codigo">Código do ingresso</label>
          <textarea
            id="codigo"
            className="input"
            rows="3"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Cole aqui o código do QR Code"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="evento">ID do evento (opcional, para checar "evento errado")</label>
          <input
            id="evento"
            className="input"
            value={eventoId}
            onChange={(e) => setEventoId(e.target.value)}
            placeholder="Ex: 2"
          />
        </div>
        <button type="submit" className="btn btn-block">Validar ingresso</button>
      </form>

      {resultado && (
        <div className={`validation-box ${resultado.status === 'valido' ? 'success' : resultado.status === 'ja_utilizado' || resultado.status === 'evento_errado' ? 'warning' : 'error'}`}>
          {resultado.status === 'valido' ? '✓ VÁLIDO' :
           resultado.status === 'ja_utilizado' ? '⚠ JÁ UTILIZADO' :
           resultado.status === 'evento_errado' ? '⚠ EVENTO ERRADO' : '✗ INVÁLIDO'}
          <div style={{ fontSize: '0.9rem', fontWeight: 'normal', marginTop: '6px' }}>{resultado.mensagem}</div>
        </div>
      )}
    </div>
  )
}