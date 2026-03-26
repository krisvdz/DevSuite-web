// ═══════════════════════════════════════════════════════════════════════════
// TYPES — Tipos compartilhados entre todo o frontend
// ═══════════════════════════════════════════════════════════════════════════
//
// 📚 CONCEITO: Tipos no frontend
//
// Em uma arquitetura real, os tipos do frontend espelham os tipos do backend.
// Isso cria um "contrato" entre as duas aplicações.
//
// Opções mais avançadas:
// - OpenAPI/Swagger: gera tipos automaticamente a partir da documentação da API
// - tRPC: compartilha tipos diretamente entre backend e frontend (sem HTTP manual)
// - GraphQL + codegen: tipos gerados do schema GraphQL
//
// Por ora, definimos manualmente — ótimo para entender a estrutura.

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
  _count?: {
    projects: number
  }
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  order: number
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  userId: string
  createdAt: string
  updatedAt: string
  tasks?: Task[]
  _count?: {
    tasks: number
  }
}

// Tipos para respostas paginadas
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Tipos para erros da API
export interface ApiError {
  error: string
  code: string
  details?: Array<{ field: string; message: string }>
}

// Tipo de autenticação (o que guardamos no estado global)
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}
