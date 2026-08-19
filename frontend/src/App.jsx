import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Registro from './pages/Registro'
import EventoDetalhe from './pages/EventoDetalhe'
import Checkout from './pages/Checkout'
import MeusIngressos from './pages/MeusIngressos'
import Portaria from './pages/Portaria'
import Painel from './pages/Painel'
import IngressoCompartilhado from './pages/IngressoCompartilhado'

function RequireAuth({ role, children }) {
  const { user, carregando } = useAuth()
  const location = useLocation()

  if (carregando) return <div className="container empty-state">Carregando...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="top-bar" aria-hidden="true" />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/eventos/:id" element={<EventoDetalhe />} />
          <Route path="/ingresso/:token" element={<IngressoCompartilhado />} />
          <Route
            path="/checkout/:reservaId"
            element={
              <RequireAuth role="cliente">
                <Checkout />
              </RequireAuth>
            }
          />
          <Route
            path="/meus-ingressos"
            element={
              <RequireAuth role="cliente">
                <MeusIngressos />
              </RequireAuth>
            }
          />
          <Route
            path="/portaria"
            element={
              <RequireAuth role="portaria">
                <Portaria />
              </RequireAuth>
            }
          />
          <Route
            path="/painel"
            element={
              <RequireAuth role="organizador">
                <Painel />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}