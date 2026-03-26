import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProjects, useCreateProject, useDeleteProject } from '../hooks/useProjects'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { FolderOpen, Plus, Trash2, LogOut, Loader2, CheckSquare } from 'lucide-react'

export function DashboardPage() {
  const { user, logout } = useAuth()
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-gray-900">TaskFlow</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Olá, {user?.name}!</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Projetos</h1>
            <p className="text-gray-500 mt-1">
              {data?.pagination.total ?? 0} projeto(s) no total
            </p>
          </div>

          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        {/* Formulário de criação */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 animate-slide-up shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Novo Projeto</h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <Input
                label="Nome do projeto"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ex: Website Redesign"
                required
                autoFocus
              />
              <Input
                label="Descrição (opcional)"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Descreva brevemente o projeto..."
              />
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  isLoading={createProject.isPending}
                >
                  Criar Projeto
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-16">
            <p className="text-red-500">Erro ao carregar projetos. Tente novamente.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && data?.data.length === 0 && (
          <div className="text-center py-16">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">Nenhum projeto ainda</h3>
            <p className="text-gray-500 mb-4">Crie seu primeiro projeto para começar</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" />
              Criar primeiro projeto
            </Button>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && !isError && data && data.data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((project) => (
              <div
                key={project.id}
                className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      deleteProject.mutate(project.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Excluir projeto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <Link to={`/projects/${project.id}`} className="block">
                  <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-1 truncate">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <CheckSquare className="h-4 w-4" />
                    <span>{project._count?.tasks ?? 0} tarefa(s)</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
