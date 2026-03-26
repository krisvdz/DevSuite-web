// ═══════════════════════════════════════════════════════════════════════════
// useProjects — Custom hooks com React Query
// ═══════════════════════════════════════════════════════════════════════════
//
// 📚 CONCEITO: React Query (TanStack Query)
//
// React Query é uma biblioteca para gerenciar "server state" (dados que vêm
// de uma API) diferente do "client state" (dados locais da UI).
//
// Por que não usar useState + useEffect para buscar dados?
//   useEffect(() => { fetch('/api/projects').then(... setProjects) }, [])
//
// Problemas com essa abordagem:
// - Sem cache: faz a requisição toda vez que o componente monta
// - Sem loading/error automático
// - Sem revalidação automática
// - Race conditions (dois requests simultâneos podem chegar fora de ordem)
// - Sem invalidação: ao criar projeto, precisa atualizar lista manualmente
//
// React Query resolve tudo isso:
// ✅ Cache inteligente com staleTime e gcTime
// ✅ Loading, error, isRefetching automáticos
// ✅ Revalidação ao focar a janela, ao reconectar...
// ✅ Mutations com invalidação automática de cache
// ✅ Optimistic Updates (atualiza UI antes da resposta)
// ✅ Deduplication (múltiplos componentes com mesma query = 1 request)

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { projectsApi, tasksApi } from '../services/api'
import { Project, PaginatedResponse, Task } from '../types'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'

// ─── Query Keys ───────────────────────────────────────────────────────────────
// 📚 CONCEITO: Query Keys
// React Query usa chaves para identificar e cachear queries.
// Boa prática: centralizar as chaves em um objeto para evitar typos.
// A chave pode ser simples ['projects'] ou hierárquica ['projects', id].
export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
  },
}

// ─── useProjects: lista todos os projetos ─────────────────────────────────────
export function useProjects(page = 1) {
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: async () => {
      const { data } = await projectsApi.list({ page })
      return data as PaginatedResponse<Project>
    },
    // staleTime: por quanto tempo os dados são considerados "frescos"
    // Durante esse período, React Query usa o cache sem refetch
    staleTime: 1000 * 60, // 1 minuto
  })
}

// ─── useProject: busca um projeto específico com suas tarefas ─────────────────
export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: async () => {
      const { data } = await projectsApi.getById(id)
      return data as Project & { tasks: Task[] }
    },
    enabled: !!id, // só executa se tiver um id válido
  })
}

// ─── useCreateProject: mutação para criar projeto ─────────────────────────────
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      projectsApi.create(data).then((res) => res.data as Project),

    // onSuccess: executado após a mutação ter sucesso
    onSuccess: () => {
      // Invalida o cache da lista → força refetch automático
      // 📚 Essa é a "mágica" do React Query: UI atualiza sem useState manual!
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
      toast.success('Projeto criado!')
    },

    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || 'Erro ao criar projeto')
    },
  })
}

// ─── useUpdateProject ────────────────────────────────────────────────────────
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { name?: string; description?: string | null }
    }) => projectsApi.update(id, data).then((res) => res.data as Project),

    onSuccess: (updatedProject) => {
      // Atualiza o cache do projeto específico
      queryClient.setQueryData(
        queryKeys.projects.detail(updatedProject.id),
        updatedProject
      )
      // Invalida a lista para que o nome atualizado apareça lá também
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
      toast.success('Projeto atualizado!')
    },

    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar projeto')
    },
  })
}

// ─── useDeleteProject ────────────────────────────────────────────────────────
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),

    onSuccess: (_, deletedId) => {
      // Remove do cache imediatamente
      queryClient.removeQueries({
        queryKey: queryKeys.projects.detail(deletedId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
      toast.success('Projeto excluído')
    },

    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir projeto')
    },
  })
}

// ─── useCreateTask ────────────────────────────────────────────────────────────
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { title: string; description?: string; status?: string }) =>
      tasksApi.create(projectId, data).then((res) => res.data as Task),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
      toast.success('Tarefa criada!')
    },

    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || 'Erro ao criar tarefa')
    },
  })
}

// ─── useUpdateTask ────────────────────────────────────────────────────────────
export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string
      data: { title?: string; status?: string; order?: number }
    }) => tasksApi.update(projectId, taskId, data).then((res) => res.data as Task),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
    },

    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar tarefa')
    },
  })
}

// ─── useDeleteTask ────────────────────────────────────────────────────────────
export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.remove(projectId, taskId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      })
      toast.success('Tarefa removida')
    },
  })
}
