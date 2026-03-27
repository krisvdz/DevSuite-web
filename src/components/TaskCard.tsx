import { useState, useRef, useEffect } from 'react'
import { Task, TaskStatus } from '../types'
import { useUpdateTask, useDeleteTask } from '../hooks/useProjects'
import { Trash2, GripVertical, ChevronDown, Check } from 'lucide-react'

interface TaskCardProps {
  task: Task
  projectId: string
  onDragStart?: (taskId: string) => void
  onDragEnd?: () => void
  isDragging?: boolean
}

const statusConfig: Record<
  TaskStatus,
  { label: string; color: string; textColor: string; dot: string; border: string; bg: string; hoverBg: string }
> = {
  TODO: {
    label: 'A fazer',
    color: 'text-gray-400',
    textColor: 'text-gray-300',
    dot: 'bg-gray-500',
    border: 'border-gray-700/50',
    bg: 'bg-gray-500/10',
    hoverBg: 'hover:bg-gray-500/15',
  },
  IN_PROGRESS: {
    label: 'Em progresso',
    color: 'text-blue-400',
    textColor: 'text-blue-300',
    dot: 'bg-blue-400',
    border: 'border-blue-700/40',
    bg: 'bg-blue-500/10',
    hoverBg: 'hover:bg-blue-500/15',
  },
  DONE: {
    label: 'Concluído',
    color: 'text-emerald-400',
    textColor: 'text-emerald-300',
    dot: 'bg-emerald-400',
    border: 'border-emerald-700/40',
    bg: 'bg-emerald-500/10',
    hoverBg: 'hover:bg-emerald-500/15',
  },
}

const STATUS_ORDER: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']

// ─────────────────────────────────────────────────────────────────────────────
// 📚 CONCEITO: Dropdown custom vs <select> nativo
//
// O <select> nativo tem duas limitações grandes:
//   1. Visual: não aceita CSS de opções no Chrome/Firefox (exceto background color)
//   2. Comportamento: não permite conteúdo rico (ícones, cores, badges)
//
// Solução: implementar manualmente com div + estado de aberto/fechado.
//
// Padrão de click-outside (fechar ao clicar fora):
//   - useRef() no container do dropdown
//   - useEffect adiciona listener global no document
//   - Handler verifica se o clique foi dentro ou fora com contains()
//   - Cleanup remove o listener ao desmontar
//
// Acessibilidade básica: onKeyDown com Escape fecha o dropdown.
// ─────────────────────────────────────────────────────────────────────────────

interface StatusDropdownProps {
  status: TaskStatus
  onChange: (status: TaskStatus) => void
  isPending?: boolean
}

function StatusDropdown({ status, onChange, isPending }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const config = statusConfig[status]

  // Click-outside: fecha o dropdown ao clicar fora do container
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function handleSelect(newStatus: TaskStatus) {
    onChange(newStatus)
    setIsOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      // Impede que cliques no dropdown ativem o drag do card pai
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        disabled={isPending}
        onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all
          ${config.bg} ${config.border} ${config.color}
          hover:brightness-125 disabled:opacity-50
        `}
      >
        {/* Dot de cor */}
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
        <span>{config.label}</span>
        <ChevronDown
          className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={`
            absolute left-0 top-full mt-1.5 z-50 min-w-[140px]
            bg-[#0d1730] border border-white/10 rounded-xl
            shadow-xl shadow-black/50 backdrop-blur-sm
            overflow-hidden
            animate-[fadeSlideDown_0.15s_ease-out]
          `}
          style={{
            // Garante que o dropdown não fique cortado pela borda do card
            // abre para cima se estiver perto do fundo
          }}
        >
          {STATUS_ORDER.map((s) => {
            const opt = statusConfig[s]
            const isSelected = s === status

            return (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors text-left
                  ${isSelected ? `${opt.bg} ${opt.textColor}` : `text-gray-400 ${opt.hoverBg} hover:${opt.textColor}`}
                `}
              >
                {/* Dot de cor da opção */}
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${opt.dot}`} />
                <span className="flex-1 font-medium">{opt.label}</span>
                {/* Checkmark na opção selecionada */}
                {isSelected && <Check className="h-3 w-3 flex-shrink-0 opacity-70" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export function TaskCard({ task, projectId, onDragStart, onDragEnd, isDragging }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)

  const updateTask = useUpdateTask(projectId)
  const deleteTask = useDeleteTask(projectId)

  const config = statusConfig[task.status]

  function handleStatusChange(newStatus: TaskStatus) {
    updateTask.mutate({ taskId: task.id, data: { status: newStatus } })
  }

  function handleTitleSave() {
    if (title.trim() && title !== task.title) {
      updateTask.mutate({ taskId: task.id, data: { title: title.trim() } })
    }
    setIsEditing(false)
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart?.(task.id)
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`group bg-[#0d1526] border rounded-xl p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing select-none
        ${config.border}
        ${isDragging ? 'opacity-40 scale-95' : 'hover:border-white/20 hover:bg-[#111b32] hover:shadow-lg'}
      `}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') {
                  setTitle(task.title)
                  setIsEditing(false)
                }
              }}
              className="w-full text-sm font-medium text-gray-200 bg-transparent border-b border-violet-400 focus:outline-none pb-0.5"
            />
          ) : (
            <p
              onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
              className={`text-sm font-medium cursor-pointer hover:text-violet-300 truncate leading-snug transition-colors mb-2.5
                ${task.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-200'}
              `}
            >
              {task.title}
            </p>
          )}

          {/* Custom status dropdown */}
          <StatusDropdown
            status={task.status}
            onChange={handleStatusChange}
            isPending={updateTask.isPending}
          />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); deleteTask.mutate(task.id) }}
          disabled={deleteTask.isPending}
          onMouseDown={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-600 hover:text-red-400 rounded flex-shrink-0 mt-0.5"
          title="Remover tarefa"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
