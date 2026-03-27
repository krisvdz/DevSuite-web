import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProjects, useCreateProject, useDeleteProject } from '../hooks/useProjects'
import { Project } from '../types'
import { FolderOpen, Plus, Trash2, Loader2, CheckSquare, LayoutDashboard } from 'lucide-react'

const PROJECT_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-rose-500',
  'from-pink-500 to-rose-400',
  'from-amber-500 to-orange-500',
]

// Cores do glow correspondentes a cada gradiente de projeto
const GLOW_COLORS = [
  '139, 92, 246',   // violet
  '59, 130, 246',   // blue
  '16, 185, 129',   // emerald
  '249, 115, 22',   // orange
  '236, 72, 153',   // pink
  '245, 158, 11',   // amber
]

function getProjectColor(index: number) {
  return PROJECT_COLORS[index % PROJECT_COLORS.length]
}

function getGlowColor(index: number) {
  return GLOW_COLORS[index % GLOW_COLORS.length]
}

// ─────────────────────────────────────────────────────────────────────────────
// 📚 CONCEITO: Mouse tracking com radial-gradient dinâmico
//
// O efeito "spotlight" é criado com um radial-gradient que segue o cursor.
// Cada card tem seu próprio estado de posição do mouse (x, y) relativo ao card.
//
// Técnica:
//   e.clientX - rect.left → posição X do mouse relativa ao card
//   e.clientY - rect.top  → posição Y do mouse relativa ao card
//
// O estilo inline usa CSS Custom Properties via string template para
// atualizar o gradiente a cada movimento do mouse — sem rerender pesado
// porque o React batches updates e o DOM style é atualizado diretamente.
//
// Por que um sub-componente separado?
// Cada card precisa de seu PRÓPRIO estado de posição.
// Se ficasse no pai (DashboardPage), todos os cards compartilhariam o
// mesmo mousePos — o hover ficaria em todos os cards ao mesmo tempo.
// ─────────────────────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project & { _count?: { tasks: number } }
  index: number
  onDelete: (id: string) => void
}

function ProjectCard({ project, index, onDelete }: ProjectCardProps) {
  const color = getProjectColor(index)
  const glowRgb = getGlowColor(index)
  const taskCount = project._count?.tasks ?? 0

  // Mouse position relativa ao card (em pixels)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // O background combina duas camadas:
      // 1. O spotlight radial que segue o mouse (cor tênue do projeto)
      // 2. A cor base do card (bg-white/3 via className)
      style={{
        background: isHovered
          ? `radial-gradient(circle 160px at ${mousePos.x}px ${mousePos.y}px, rgba(${glowRgb}, 0.09) 0%, transparent 75%),
             rgba(255,255,255,0.03)`
          : undefined,
      }}
      className={`group relative border rounded-2xl p-5 transition-all duration-200
        hover:border-white/15 hover:-translate-y-0.5 hover:shadow-lg
        ${isHovered ? 'border-white/10' : 'border-white/8 bg-white/3'}
      `}
    >
      {/* Top accent line — aparece no hover com a cor do projeto */}
      <div
        className={`absolute top-0 left-4 right-4 h-px bg-gradient-to-r ${color} transition-opacity rounded-full
          ${isHovered ? 'opacity-50' : 'opacity-0'}
        `}
      />

      <div className="flex items-start justify-between mb-4">
        <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${color} opacity-90`}>
          <FolderOpen className="h-4 w-4 text-white" />
        </div>
        <button
          onClick={(e) => {
            e.preventDefault()
            onDelete(project.id)
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          title="Excluir projeto"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <Link to={`/app/tasks/${project.id}`} className="block">
        <h3 className="font-semibold text-white hover:text-violet-300 transition-colors mb-1 truncate">
          {project.name}
        </h3>
        {project.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">{project.description}</p>
        )}
        {!project.description && <div className="mb-4" />}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <CheckSquare className="h-3.5 w-3.5" />
            <span>
              {taskCount} tarefa{taskCount !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-xs text-gray-600">
            {new Date(project.createdAt ?? Date.now()).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        </div>
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useProjects()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()

  const [showForm, setShowForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projectName.trim()) return
    await createProject.mutateAsync({
      name: projectName.trim(),
      description: projectDescription.trim() || undefined,
    })
    setProjectName('')
    setProjectDescription('')
    setShowForm(false)
  }

  const projects = data?.data ?? []
  const totalTasks = projects.reduce((sum, p) => sum + (p._count?.tasks ?? 0), 0)

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="h-5 w-5 text-violet-400" />
              <h1 className="text-xl font-bold">TaskFlow</h1>
            </div>
            <p className="text-sm text-gray-500">
              Olá, <span className="text-gray-300">{user?.name}</span>! Você tem{' '}
              <span className="text-violet-400 font-semibold">{projects.length} projeto(s)</span> e{' '}
              <span className="text-blue-400 font-semibold">{totalTasks} tarefa(s)</span>.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-500/20"
          >
            <Plus className="h-4 w-4" />
            Novo Projeto
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-white/5 border border-violet-500/30 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-white mb-4">Criar novo projeto</h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Nome do projeto"
                autoFocus
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
              />
              <input
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={createProject.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {createProject.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Criar Projeto
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
          </div>
        )}

        {isError && (
          <div className="text-center py-16 text-red-400">Erro ao carregar projetos.</div>
        )}

        {!isLoading && !isError && projects.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl mb-4">
              <FolderOpen className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum projeto ainda</h3>
            <p className="text-gray-500 mb-6">
              Crie seu primeiro projeto para começar a organizar suas tarefas
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-sm font-medium mx-auto"
            >
              <Plus className="h-4 w-4" />
              Criar primeiro projeto
            </button>
          </div>
        )}

        {!isLoading && !isError && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onDelete={(id) => deleteProject.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
