import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProject, useCreateTask } from '../hooks/useProjects'
import { Task, TaskStatus } from '../types'
import { TaskCard } from '../components/TaskCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'

// Configuração das colunas do Kanban
const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TODO', label: 'A Fazer', color: 'bg-gray-100' },
  { status: 'IN_PROGRESS', label: 'Em Progresso', color: 'bg-blue-50' },
  { status: 'DONE', label: 'Concluído', color: 'bg-green-50' },
]

export function ProjectPage() {
  // useParams: lê os parâmetros dinâmicos da URL (/projects/:id)
  // 📚 CONCEITO: React Router faz o routing no cliente (sem reload de página)
  const { id } = useParams<{ id: string }>()
  const { data: project, isLoading, isError } = useProject(id!)

  const createTask = useCreateTask(id!)

  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // Agrupa tarefas por status para o board Kanban
  const tasksByStatus = columns.reduce(
    (acc, col) => {
      acc[col.status] = (project?.tasks ?? [])
        .filter((t) => t.status === col.status)
        .sort((a, b) => a.order - b.order)
      return acc
    },
    {} as Record<TaskStatus, Task[]>
  )

  async function handleAddTask(status: TaskStatus) {
    if (!newTaskTitle.trim()) return

    await createTask.mutateAsync({
      title: newTaskTitle.trim(),
      status,
    })

    setNewTaskTitle('')
    setActiveColumn(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Projeto não encontrado</p>
          <Link to="/dashboard">
            <Button variant="secondary">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {project.tasks?.length ?? 0} tarefa(s)
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div key={column.status} className="flex flex-col gap-3">
              {/* Cabeçalho da coluna */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold text-gray-700 px-2.5 py-0.5 rounded-full ${column.color}`}
                  >
                    {column.label}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {tasksByStatus[column.status].length}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setActiveColumn(
                      activeColumn === column.status ? null : column.status
                    )
                  }
                  className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Formulário inline de nova tarefa */}
              {activeColumn === column.status && (
                <div className="bg-white border-2 border-blue-200 rounded-lg p-3 animate-slide-up">
                  <Input
                    placeholder="Título da tarefa..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask(column.status)
                      if (e.key === 'Escape') setActiveColumn(null)
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddTask(column.status)}
                      isLoading={createTask.isPending}
                    >
                      Adicionar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveColumn(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de tarefas */}
              <div className="flex flex-col gap-2 min-h-[100px]">
                {tasksByStatus[column.status].map((task) => (
                  <TaskCard key={task.id} task={task} projectId={id!} />
                ))}

                {tasksByStatus[column.status].length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                    Sem tarefas aqui
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
