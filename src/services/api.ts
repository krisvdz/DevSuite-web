// ═══════════════════════════════════════════════════════════════════════════
// API SERVICE — Cliente HTTP centralizado com Axios
// ═══════════════════════════════════════════════════════════════════════════
//
// 📚 CONCEITO: Por que centralizar as chamadas de API?
//
// Se você fizer fetch() diretamente em cada componente:
// - Repetição de lógica (token header, tratamento de erros, base URL...)
// - Difícil de manter (trocar a URL base exige mudar em 50 lugares)
// - Sem controle global (impossível adicionar loading global, retry, etc.)
//
// Com um cliente centralizado (Axios instance):
// - Configuração única (baseURL, timeout, headers padrão)
// - Interceptors: lógica executada em TODA request/response
// - Fácil de testar (mock de um único lugar)
//
// 📚 CONCEITO: Axios vs fetch()
// fetch() é nativo do browser (sem dependência extra).
// Axios oferece: interceptors, timeout fácil, cancelamento, e transforma
// automaticamente o JSON. Para projetos profissionais, Axios é muito usado.

import axios, { AxiosError } from 'axios'
import { ApiError } from '../types'

// Cria uma instância do Axios com configurações padrão
export const api = axios.create({
  // Em dev com Vite proxy: /api → http://localhost:4000/api
  // Em produção: https://sua-api.railway.app
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000, // 10 segundos — evita requests pendurados
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ─────────────────────────────────────────────────────
// 📚 CONCEITO: Interceptors
// Interceptors são executados em TODA requisição/resposta.
// Use para: adicionar token, logar requests, modificar dados...
//
// Request interceptor: executado ANTES de cada request sair
api.interceptors.request.use(
  (config) => {
    // Adiciona o token JWT em todas as requisições automaticamente
    const token = localStorage.getItem('taskflow:token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ────────────────────────────────────────────────────
// Response interceptor: executado em TODA resposta recebida
api.interceptors.response.use(
  // Resposta de sucesso (2xx): passa direto
  (response) => response,

  // Resposta de erro: tratamento centralizado
  (error: AxiosError<ApiError>) => {
    // Token expirado → redireciona para login
    if (error.response?.status === 401) {
      const code = error.response.data?.code
      if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN') {
        // Limpa dados de auth e força novo login
        localStorage.removeItem('taskflow:token')
        localStorage.removeItem('taskflow:user')
        // Em uma SPA, redirecionamos programaticamente
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ user: { id: string; name: string; email: string }; token: string }>(
      '/auth/register',
      data
    ),

  login: (data: { email: string; password: string }) =>
    api.post<{ user: { id: string; name: string; email: string }; token: string }>(
      '/auth/login',
      data
    ),

  me: () => api.get('/auth/me'),
}

// ─── Projects API ────────────────────────────────────────────────────────────
export const projectsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get('/projects', { params }),

  getById: (id: string) =>
    api.get(`/projects/${id}`),

  create: (data: { name: string; description?: string }) =>
    api.post('/projects', data),

  update: (id: string, data: { name?: string; description?: string | null }) =>
    api.patch(`/projects/${id}`, data),

  remove: (id: string) =>
    api.delete(`/projects/${id}`),
}

// ─── Tasks API ────────────────────────────────────────────────────────────────
export const tasksApi = {
  create: (
    projectId: string,
    data: { title: string; description?: string; status?: string }
  ) => api.post(`/projects/${projectId}/tasks`, data),

  update: (
    projectId: string,
    taskId: string,
    data: { title?: string; description?: string | null; status?: string; order?: number }
  ) => api.patch(`/projects/${projectId}/tasks/${taskId}`, data),

  remove: (projectId: string, taskId: string) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),

  reorder: (projectId: string, updates: Array<{ id: string; order: number }>) =>
    api.patch(`/projects/${projectId}/tasks/reorder`, updates),
}
