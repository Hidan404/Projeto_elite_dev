import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      const data = await login(email, senha)
      const dest = data.role === 'organizador' ? '/painel' : data.role === 'portaria' ? '/portaria' : '/'
      navigate(dest)
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao entrar. Verifique suas credenciais.')
    }
  }

  return (
    <div className="container auth-page">
      <h1 className="auth-title">Entrar</h1>
      <p className="auth-sub">Acesse sua conta para comprar ou gerenciar ingressos.</p>

      {erro && <div className="form-error">{erro}</div>}

      <form onSubmit={handleSubmit} className="card card-padding">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            type="password"
            className="input"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-block">Entrar</button>
        <p className="auth-footnote">
          Não tem conta? <Link to="/registro">Crie uma</Link>
        </p>
      </form>
    </div>
  )
}