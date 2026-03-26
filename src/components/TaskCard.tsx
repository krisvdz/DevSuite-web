import { useState } from 'react'
import { Task, TaskStatus } from '../types'
import { useUpdateTask, useDeleteTask } from '../hooks/useProjects'
import { Button } from './ui/Button'
import { Trash2, GripVertical } from 'lucide-react'

interface TaskCardProps {
  task: Task
  projectId: string
}

// Mapa de cores por status — visual do kanban
const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  TODO: {
    label: 'A fazer',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
  IN_PROGRESS: {
    label: 'Em progresso',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  DONE: {
    label: 'Concluído',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
}

export function TaskCard({ task, projectId }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)

  const updateTask = useUpdateTask(projectId)
  const deleteTask = useDeleteTask(projectId)

  const statusOptions: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']

  function handleStatusChange(newStatus: TaskStatus) {
    updateTask.mutate({ taskId: task.id, data: { status: newStatus } })
  }

  function handleTitleSave() {
    if (title.trim() && title !== task.title) {
      updateTask.mutate({ taskId: task.id, data: { title: title.trim() } })
    }
    setIsEditing(false)
  }

  const config = statusConfig[task.status]

  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-start gap-2">
        {/* Ícone de drag handle (visual — drag-and-drop completo requereria dnd-kit) */}
        <GripVertical className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0 cursor-grab" />

        <div className="flex-1 min-w-0">
          {/* Título editável inline */}
          {isEditing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') {
                  setTitle(task.title)
                  setIsEditing(false)
                }
              }}
              className="w-full text-sm font-medium text-gray-800 bg-transparent border-b border-blue-400 focus:outline-none pb-0.5"
            />
          ) : (
            <p
              onClick={() => setIsEditing(true)}
              className={`text-sm font-medium text-gray-800 cursor-pointer hover:text-blue-600 truncate ${
                task.status === 'DONE' ? 'line-through text-gray-400' : ''
              }`}
            >
              {task.title}
            </p>
          )}

          {/* Seletor de status */}
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            className={`mt-2 text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-300 ${config.bg} ${config.color}`}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusConfig[status].label}
              </option>
            ))}
          </select>
        </div>

        {/* Botão de deletar (aparece no hover) */}
        <button
          onClick={() => deleteTask.mutate(task.id)}
          disabled={deleteTask.isPending}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 rounded"
          title="Remover tarefa"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
