import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Registro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      await register(nome, email, senha, 'cliente')
      navigate('/login')
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar conta.')
    }
  }

  return (
    <div className="container auth-page">
      <h1 className="auth-title">Criar conta</h1>
      <p className="auth-sub">Cadastre-se como cliente para comprar ingressos.</p>

      {erro && <div className="form-error">{erro}</div>}

      <form onSubmit={handleSubmit} className="card card-padding">
        <div className="form-group">
          <label htmlFor="nome">Nome</label>
          <input id="nome" className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-block">Criar conta</button>
        <p className="auth-footnote">
          Já tem conta? <Link to="/login">Entre aqui</Link>
        </p>
      </form>
    </div>
  )
}