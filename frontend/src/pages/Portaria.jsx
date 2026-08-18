import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../services/api'

export default function Portaria() {
  const [codigo, setCodigo] = useState('')
  const [eventoId, setEventoId] = useState('')
  const [eventos, setEventos] = useState([])
  const [resultado, setResultado] = useState(null)
  const [modo, setModo] = useState('manual')
  const [erro, setErro] = useState('')
  const [lendo, setLendo] = useState(false)
  const [validando, setValidando] = useState(false)
  const [sessaoScan, setSessaoScan] = useState(0)
  const scannerRef = useRef(null)
  const codigoInputRef = useRef(null)

  useEffect(() => {
    api.get('/events').then((r) => setEventos(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (modo !== 'camera') return
    setErro('')
    setResultado(null)
    setLendo(true)
    scannerRef.current = new Html5Qrcode('reader')
    scannerRef.current
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          setCodigo(text)
          setLendo(false)
          scannerRef.current?.stop().then(() => scannerRef.current?.clear()).catch(() => {})
          validarCodigo(text)
        },
        () => {},
      )
      .catch((e) => {
        setErro('Não foi possível acessar a câmera: ' + (e?.message || e))
        setLendo(false)
      })

    return () => {
      scannerRef.current?.stop().then(() => scannerRef.current?.clear()).catch(() => {})
      scannerRef.current = null
    }
  }, [modo, sessaoScan])

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().then(() => scannerRef.current?.clear()).catch(() => {})
      scannerRef.current = null
    }
  }, [])

  const pararCamera = async () => {
    try {
      await scannerRef.current?.stop()
      await scannerRef.current?.clear()
    } catch {}
    scannerRef.current = null
    setLendo(false)
  }

  const validarCodigo = async (texto) => {
    setErro('')
    setResultado(null)
    setValidando(true)
    try {
      const { data } = await api.post('/portaria/validate', {
        codigo: texto,
        evento_id: eventoId ? Number(eventoId) : null,
      })
      setResultado(data)
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao validar.')
    } finally {
      setValidando(false)
    }
  }

  const validar = async (e) => {
    e.preventDefault()
    await validarCodigo(codigo)
    setCodigo('')
    codigoInputRef.current?.focus()
  }

  const tituloResultado = {
    valido: '✓ VÁLIDO',
    ja_utilizado: '⚠ JÁ UTILIZADO',
    evento_errado: '⚠ EVENTO ERRADO',
    invalido: '✗ INVÁLIDO',
  }

  return (
    <div className="container" style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <h1>Portaria</h1>
        <p>Valide o ingresso do cliente na entrada. Leia o QR pela câmera ou digite o código.</p>
      </div>

      <div className="flex mb-lg" style={{ gap: '10px' }}>
        <button className={`btn btn-sm ${modo === 'manual' ? '' : 'btn-secondary'}`} onClick={() => { setModo('manual'); pararCamera() }}>
          Digitar código
        </button>
        <button className={`btn btn-sm ${modo === 'camera' ? '' : 'btn-secondary'}`} onClick={() => { setModo('camera') }}>
          Ler com câmera
        </button>
      </div>

      {modo === 'camera' && (
        <div className="card card-padding mb-lg">
          <div id="reader"></div>
          {lendo && <p className="event-meta mt-sm">Aguardando QR Code...</p>}
          {!lendo && (
            <>
              <p className="event-meta mt-sm">QR lido e enviado para validação.</p>
              <button className="btn btn-sm btn-secondary mt-sm" onClick={() => setSessaoScan((s) => s + 1)}>
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
            ref={codigoInputRef}
            className="input"
            rows="3"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Cole aqui o código do QR Code"
            required={modo === 'manual'}
          />
        </div>
        <div className="form-group">
          <label htmlFor="evento">Evento (para checar "evento errado")</label>
          <select
            id="evento"
            className="input"
            value={eventoId}
            onChange={(e) => setEventoId(e.target.value)}
          >
            <option value="">Todos os eventos</option>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.titulo}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-block" disabled={validando}>
          {validando ? 'Validando...' : 'Validar ingresso'}
        </button>
      </form>

      {resultado && (
        <div className={`validation-box ${resultado.status === 'valido' ? 'success' : resultado.status === 'ja_utilizado' || resultado.status === 'evento_errado' ? 'warning' : 'error'}`}>
          <strong>{tituloResultado[resultado.status] || resultado.status}</strong>
          <div className="event-meta mt-sm" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>{resultado.mensagem}</div>
        </div>
      )}
    </div>
  )
}