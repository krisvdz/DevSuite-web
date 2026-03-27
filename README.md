# DevSuite — Frontend

> Suite de produtividade para desenvolvedores. Três ferramentas integradas em uma interface dark, moderna e totalmente responsiva.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss)

---

## Ferramentas

### ✅ TaskFlow — Gerenciador de Projetos Kanban
Organize tarefas em um board Kanban com drag-and-drop nativo (HTML5 API). Crie projetos, adicione tarefas e mova-as entre as colunas **A Fazer → Em Progresso → Concluído** arrastando os cards.

### 🔭 Dev Pulse — GitHub Trending Explorer
Explore repositórios trending no GitHub filtrados por linguagem (TypeScript, JavaScript, Python, Go, Rust, Java, C++, Kotlin). Dados em tempo real via GitHub Search API pública, com cache de 5 minutos via React Query.

### ⏱️ Focus Timer — Pomodoro
Timer Pomodoro com SVG animado, três modos (Foco 25min / Pausa Curta 5min / Pausa Longa 15min), histórico de sessões no banco de dados e gráfico semanal. Timer **resiliente a troca de abas** via deadline-based timing + `visibilitychange` API.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + Vite 5 |
| Linguagem | TypeScript 5 (strict) |
| Estilo | Tailwind CSS 3 (dark theme) |
| Estado servidor | TanStack React Query v5 |
| Roteamento | React Router DOM v6 |
| HTTP Client | Axios |
| Notificações | react-hot-toast |
| Ícones | Lucide React |

---

## Estrutura do Projeto

```
src/
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx       # Sidebar + Outlet (layout compartilhado)
│   └── TaskCard.tsx            # Card do Kanban com drag-and-drop e dropdown custom
├── contexts/
│   └── AuthContext.tsx         # Context API + JWT em localStorage
├── hooks/
│   └── useProjects.ts          # Custom hooks com React Query
├── pages/
│   ├── LandingPage.tsx         # Hero com animated background
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx       # Grid de projetos com spotlight hover
│   ├── ProjectPage.tsx         # Board Kanban com drag-and-drop
│   ├── DevPulsePage.tsx        # GitHub trending repos
│   └── FocusTimerPage.tsx      # Pomodoro timer
├── services/
│   └── api.ts                  # Axios instance + interceptors JWT
├── types/
│   └── index.ts                # Tipos compartilhados (Project, Task, User...)
└── styles/
    └── global.css              # Dark scrollbar, animações, utilities
```

---

## Rodando o Projeto

### Pré-requisitos
- Node.js 18+
- API do DevSuite rodando (ver [taskflow-api](https://github.com/krisvdz/taskflow-api))

### Instalação

```bash
# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cp .env.example .env
```

### Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:3001/api
```

### Desenvolvimento

```bash
npm run dev
# Abre em http://localhost:5173
```

### Build de Produção

```bash
npm run build
npm run preview
```

---

## Conceitos Abordados no Código

O projeto é intencionalmente comentado para fins de aprendizado. Conceitos presentes no código:

- **React Query**: server state, caching, invalidação, `staleTime`, mutations com `onSuccess`
- **Custom Hooks**: separação de lógica de UI (`useProjects`, `useCreateTask`)
- **Context API + JWT**: autenticação persistida, interceptors Axios automáticos
- **Deadline-based Timer**: `Date.now()` + `visibilitychange` para timer preciso mesmo com aba em background
- **Drag-and-drop nativo**: HTML5 `draggable`, `onDragStart`, `onDragOver`, `onDrop` — sem libs externas
- **Compound Components**: `AppLayout` com `<Outlet />` do React Router
- **Mouse tracking**: `radial-gradient` dinâmico seguindo o cursor para efeito spotlight nos cards
- **Stable ref pattern**: `useRef` + atualização em render para callbacks estáveis em `useEffect`
- **Click-outside pattern**: `useRef` + `document.addEventListener` para fechar dropdowns

---

## Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento (HMR)
npm run build        # Build de produção (TypeScript + Vite)
npm run preview      # Preview do build local
npm run lint         # ESLint no diretório src/
npm run type-check   # Verificação de tipos sem emitir arquivos
```

---

> Projeto criado para estudo de desenvolvimento fullstack moderno.
> Em breve renomeado para **DevSuite** no GitHub.
