import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProject, useCreateTask, useUpdateTask } from '../hooks/useProjects'
import { Task, TaskStatus } from '../types'
import { TaskCard } from '../components/TaskCard'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// 📚 CONCEITO: HTML5 Drag and Drop API
//
// O browser tem drag-and-drop nativo (sem libs!):
//
// 1. <div draggable> — torna um elemento arrastável
// 2. onDragStart(e) — chamado quando o usuário começa a arrastar
//    e.dataTransfer.setData('key', value) — armazena dados no "clipboard" do drag
// 3. onDragOver(e) — chamado quando um item arrastado passa por cima
//    e.preventDefault() — OBRIGATÓRIO para permitir drop!
// 4. onDrop(e) — chamado quando o item é solto
//    e.dataTransfer.getData('key') — lê os dados do drag
//
// Padrão aqui: ao soltar numa coluna diferente, atualizamos o status da tarefa.
// O backend recebe PATCH /tasks/:id com { status: newStatus }.
// ─────────────────────────────────────────────────────────────────────────────

const columns: {
  status: TaskStatus
  label: string
  dotColor: string
  borderColor: string
  bgColor: string
  emptyEmoji: string
  emptyText: string
}[] = [
  {
    status: 'TODO',
    label: 'A Fazer',
    dotColor: 'bg-gray-400',
    borderColor: 'border-gray-700/60',
    bgColor: 'bg-gray-900/20',
    emptyEmoji: '📝',
    emptyText: 'Nenhuma tarefa aqui',
  },
  {
    status: 'IN_PROGRESS',
    label: 'Em Progresso',
    dotColor: 'bg-blue-400',
    borderColor: 'border-blue-800/40',
    bgColor: 'bg-blue-950/20',
    emptyEmoji: '⚡',
    emptyText: 'Arraste tarefas para cá',
  },
  {
    status: 'DONE',
    label: 'Concluído',
    dotColor: 'bg-emerald-400',
    borderColor: 'border-emerald-800/40',
    bgColor: 'bg-emerald-950/20',
    emptyEmoji: '✅',
    emptyText: 'Arraste tarefas para cá',
  },
]

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const { data: project, isLoading, isError } = useProject(id!)
  const createTask = useCreateTask(id!)
  const updateTask = useUpdateTask(id!)

  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // ── Drag-and-drop state ───────────────────────────────────────────────────
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

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
    await createTask.mutateAsync({ title: newTaskTitle.trim(), status })
    setNewTaskTitle('')
    setActiveColumn(null)
  }

  // ── Drop handler: muda o status da tarefa ao soltar em nova coluna ────────
  function handleDrop(e: React.DragEvent, targetStatus: TaskStatus) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return

    // Encontra a tarefa para checar se o status mudou realmente
    const task = project?.tasks.find((t) => t.id === taskId)
    if (task && task.status !== targetStatus) {
      updateTask.mutate({ taskId, data: { status: targetStatus } })
    }

    setDraggedTaskId(null)
    setDragOverColumn(null)
  }

  const totalDone = (project?.tasks ?? []).filter((t) => t.status === 'DONE').length
  const total = project?.tasks?.length ?? 0
  const progress = total > 0 ? Math.round((totalDone / total) * 100) : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">Projeto não encontrado</p>
          <Link to="/app/tasks" className="text-sm text-violet-400 hover:underline">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <Link
          to="/app/tasks"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-3 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Voltar
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>
            )}
          </div>
          {total > 0 && (
            <div className="text-right">
              <p className="text-sm font-semibold text-white">{progress}%</p>
              <p className="text-xs text-gray-500">
                {totalDone}/{total} concluídas
              </p>
              <div className="w-24 h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {columns.map((column) => {
            const isDropTarget = dragOverColumn === column.status
            const isDraggingOver = draggedTaskId !== null && isDropTarget

            return (
              <div
                key={column.status}
                // ── Droppable zone ──────────────────────────────────────────
                // onDragOver: previne o comportamento padrão do browser
                //   (sem isso, o drop não é permitido)
                // onDragEnter/Leave: atualiza o estado visual da coluna
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setDragOverColumn(column.status)
                }}
                onDragEnter={(e) => {
                  e.preventDefault()
                  setDragOverColumn(column.status)
                }}
                onDragLeave={(e) => {
                  // só limpa se saiu da coluna (não de um filho)
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverColumn(null)
                  }
                }}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${column.dotColor}`} />
                    <span className="text-sm font-semibold text-gray-200">{column.label}</span>
                    <span className="text-xs text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-md tabular-nums">
                      {tasksByStatus[column.status].length}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setActiveColumn(activeColumn === column.status ? null : column.status)
                    }
                    className="p-1.5 text-gray-600 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-all"
                    title="Adicionar tarefa"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Add task form */}
                {activeColumn === column.status && (
                  <div className="bg-white/5 border border-violet-500/30 rounded-xl p-3 mb-3">
                    <input
                      placeholder="Título da tarefa..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      autoFocus
                      className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none mb-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask(column.status)
                        if (e.key === 'Escape') setActiveColumn(null)
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddTask(column.status)}
                        disabled={createTask.isPending}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {createTask.isPending ? 'Adicionando...' : 'Adicionar'}
                      </button>
                      <button
                        onClick={() => setActiveColumn(null)}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Column body — droppable area with visual feedback */}
                <div
                  className={`min-h-[260px] rounded-2xl border p-3 space-y-2.5 transition-all duration-200
                    ${column.bgColor}
                    ${column.borderColor}
                    ${isDraggingOver
                      ? 'border-violet-500/50 bg-violet-500/5 shadow-lg shadow-violet-500/10'
                      : 'hover:border-white/10'
                    }
                  `}
                >
                  {tasksByStatus[column.status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectId={id!}
                      onDragStart={(taskId) => setDraggedTaskId(taskId)}
                      onDragEnd={() => {
                        setDraggedTaskId(null)
                        setDragOverColumn(null)
                      }}
                      isDragging={draggedTaskId === task.id}
                    />
                  ))}

                  {tasksByStatus[column.status].length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div
                        className={`text-2xl mb-2 transition-opacity ${
                          isDraggingOver ? 'opacity-80 scale-110' : 'opacity-20'
                        }`}
                      >
                        {isDraggingOver ? '🎯' : column.emptyEmoji}
                      </div>
                      <p className={`text-xs transition-colors ${isDraggingOver ? 'text-violet-400' : 'text-gray-700'}`}>
                        {isDraggingOver ? 'Solte aqui!' : column.emptyText}
                      </p>
                    </div>
                  )}

                  {/* Drop indicator — visible line at bottom when dragging over non-empty column */}
                  {isDraggingOver && tasksByStatus[column.status].length > 0 && (
                    <div className="h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 animate-pulse mx-2" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
