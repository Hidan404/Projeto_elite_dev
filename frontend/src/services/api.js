import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8004',
  withCredentials: true,
  timeout: 90000,
})

api.interceptors.response.use(
  (r) => r,
  async (erro) => {
    const original = erro.config
    if (!original || original._retry) throw erro
    const semResposta = !erro.response
    if (semResposta) {
      original._retry = true
      await new Promise((r) => setTimeout(r, 2000))
      return api(original)
    }
    throw erro
  },
)

export default api