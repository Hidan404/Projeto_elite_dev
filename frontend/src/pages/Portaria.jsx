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

  const pararScanner = async (scanner = scannerRef.current) => {
    if (!scanner) return
    try {
      if (scanner.isScanning) await scanner.stop()
      await scanner.clear()
    } catch {}
  }

  useEffect(() => {
    if (modo !== 'camera') return
    setErro('')
    setResultado(null)
    setLendo(true)
    const scanner = new Html5Qrcode('reader')
    scannerRef.current = scanner
    const largura = Math.min(Math.floor(window.innerWidth * 0.8), 340)
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: largura, height: largura } },
        (text) => {
          setCodigo(text)
          setLendo(false)
          pararScanner(scanner)
          validarCodigo(text)
        },
        () => {},
      )
      .then(() => {
        scanner.applyVideoConstraints({ advanced: [{ zoom: 2 }] }).catch(() => {})
      })
      .catch((e) => {
        setErro('Não foi possível acessar a câmera: ' + (e?.message || e))
        setLendo(false)
      })

    return () => {
      pararScanner(scanner)
      if (scannerRef.current === scanner) scannerRef.current = null
    }
  }, [modo, sessaoScan])

  const pararCamera = async () => {
    await pararScanner()
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