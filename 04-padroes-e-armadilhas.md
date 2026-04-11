# Padrões que Sêniors Debatem — e o Vocabulário que Você Precisa Saber

> Tópicos que aparecem frequentemente em conversas de sêniors mas raramente em tutoriais.
> Baseado no contexto do **DevSuite** e no ciclo fullstack moderno.

---

## Índice

1. [Caching — Onde os Dados Ficam](#1-caching--onde-os-dados-ficam)
2. [Race Conditions e Debounce](#2-race-conditions-e-debounce)
3. [Soft Delete vs Hard Delete](#3-soft-delete-vs-hard-delete)
4. [Feature Flags — Deploy sem Ativar](#4-feature-flags--deploy-sem-ativar)
5. [Idempotência — Segurança em Requisições Repetidas](#5-idempotência--segurança-em-requisições-repetidas)
6. [Glossário — Termos que Sêniors Usam](#6-glossário--termos-que-sêniors-usam)

---

## 1. Caching — Onde os Dados Ficam

Cache é guardar uma cópia de dados para não precisar buscá-los de novo. Existe em várias camadas — e é comum sêniors discutirem em qual camada colocar um cache específico.

```
Usuário → CDN → Servidor → Cache em Memória → Banco de Dados
          ↑         ↑            ↑
     mais rápido            mais controle
```

### 1.1 Cache no Cliente — React Query (staleTime)

Já coberto no doc 01. O `staleTime` define por quanto tempo o dado é considerado "fresco" — durante esse tempo, o React Query não refaz a requisição.

```typescript
useQuery({
  queryKey: ['projects'],
  queryFn: () => projectsApi.list(),
  staleTime: 5 * 60 * 1000,  // 5 minutos sem refetch
  gcTime: 10 * 60 * 1000,    // remove do cache depois de 10 min sem uso
});
```

### 1.2 HTTP Cache Headers — Cache no Browser e CDN

O servidor pode dizer ao browser (e ao CDN) por quanto tempo manter o dado em cache:

```typescript
// Para dados estáticos (imagens, assets): cache longo
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
// "qualquer um pode cachear, por 1 ano, nunca muda"

// Para dados da API: sem cache (dados mudam frequentemente)
res.setHeader('Cache-Control', 'no-store');

// Para dados que podem ficar em cache mas precisam ser revalidados:
res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
res.setHeader('ETag', '"abc123"');  // hash do conteúdo
// Browser pergunta: "ainda é abc123?" → servidor diz: "sim" (304 Not Modified)
```

**Para o DevSuite:** assets estáticos (JS, CSS) do Vite já têm hash no nome (`main.abc123.js`) — o Vercel e o browser cacheiam automaticamente para sempre. Dados da API não devem ser cacheados no HTTP por padrão.

### 1.3 Cache no Servidor — Redis (Conceito)

Para operações custosas que muitos usuários fazem (relatórios, rankings, dados agregados), guarda o resultado em memória para não ir ao banco toda vez:

```
Sem cache:  Request → Banco (query pesada, 500ms) → Response
Com Redis:  Request → Redis (1ms, se existir) → Response
                  ↘ se não existir → Banco → salva no Redis → Response
```

```typescript
// Conceito (não implementado no DevSuite — não é necessário na escala atual)
async function getDashboardStats(userId: string) {
  const cacheKey = `stats:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const stats = await prisma.task.groupBy({ /* query pesada */ });
  await redis.setex(cacheKey, 300, JSON.stringify(stats)); // expira em 5 min
  return stats;
}
```

**Quando usar Redis:** quando a mesma query pesada é feita muitas vezes e o dado pode ter alguns minutos de defasagem. **Não use prematuramente** — adiciona complexidade e um novo ponto de falha. Primeiro meça, depois otimize.

---

## 2. Race Conditions e Debounce

### 2.1 Race Condition em Requisições

Usuário digita "re", "rea", "reac" rapidamente. Três requisições são disparadas. A segunda pode chegar depois da terceira — e você mostra um resultado desatualizado.

```tsx
// ❌ Race condition clássica
const [results, setResults] = useState([]);

useEffect(() => {
  fetch(`/api/search?q=${query}`)
    .then(r => r.json())
    .then(setResults);  // ← qual das 3 requisições chega por último?
}, [query]);

// ✅ Com cleanup do useEffect — cancela a requisição anterior
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/search?q=${query}`, { signal: controller.signal })
    .then(r => r.json())
    .then(setResults)
    .catch(err => {
      if (err.name === 'AbortError') return; // cancelado — ignorar
    });

  return () => controller.abort(); // cleanup: cancela ao desmontar ou ao mudar query
}, [query]);
```

**O React Query já resolve isso automaticamente** — mais uma razão para não usar `useEffect` para buscar dados.

### 2.2 Debounce — Esperar o Usuário Parar de Digitar

Não dispare uma requisição a cada tecla. Espere o usuário parar de digitar por X ms:

```tsx
import { useDebouncedValue } from '@mantine/hooks'; // ou implemente manualmente

function SearchInput() {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 300); // 300ms após parar de digitar

  const { data } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.search(debouncedQuery),
    enabled: debouncedQuery.length > 2, // só busca com 3+ caracteres
  });

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### 2.3 Double Submit — Evitar Clique Duplo

Usuário clica "Criar Projeto" duas vezes antes da resposta chegar. Dois projetos são criados.

```tsx
// ✅ React Query já protege: isPending desabilita o botão
<button
  onClick={() => createProject.mutate(data)}
  disabled={createProject.isPending}  // desabilita durante a requisição
>
  {createProject.isPending ? 'Criando...' : 'Criar Projeto'}
</button>
```

No backend, proteção extra: **idempotency key** (ver seção 5).

---

## 3. Soft Delete vs Hard Delete

### Hard Delete — Deletar de Verdade

```typescript
await prisma.task.delete({ where: { id } });
// Registro removido do banco — não tem volta
```

**Problema:** usuário deleta sem querer e quer desfazer. Dado vai para relatório e some. Log de auditoria fica incompleto.

### Soft Delete — Marcar como Deletado

```prisma
// schema.prisma
model Task {
  id        String    @id
  title     String
  deletedAt DateTime? // null = ativo, data = deletado
}
```

```typescript
// "Deletar" — só marca
await prisma.task.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Buscar — sempre filtra os deletados
await prisma.task.findMany({
  where: { projectId, deletedAt: null }, // ← nunca esqueça isso!
});
```

**Vantagens:** possível restaurar ("lixeira"), dados preservados para auditoria, relatórios históricos corretos.

**Desvantagens:** banco cresce com dados "mortos", queries precisam sempre do filtro `deletedAt: null` (fácil esquecer e mostrar registros deletados).

**Decisão prática para o DevSuite:** tarefas e projetos poderiam se beneficiar de soft delete para uma feature de "lixeira". Para dados de sessão de foco, hard delete é suficiente.

---

## 4. Feature Flags — Deploy sem Ativar

Feature flag é uma condição no código que ativa ou desativa uma funcionalidade sem novo deploy.

**Por que existe:** times grandes fazem deploy várias vezes por dia. Se uma feature não está pronta para todos os usuários ainda, você faz o deploy do código (desabilitado) e ativa depois — sem precisar de um novo deploy.

```typescript
// Versão simples: variável de ambiente
const ENABLE_MARKET_PULSE = process.env.ENABLE_MARKET_PULSE === 'true';

// No código:
if (ENABLE_MARKET_PULSE) {
  app.use('/api/market', marketRouter);
}
```

```tsx
// No frontend:
{import.meta.env.VITE_ENABLE_MARKET_PULSE === 'true' && (
  <SidebarItem to="/app/market" label="Market Pulse" />
)}
```

**Serviços especializados** (LaunchDarkly, Flagsmith, PostHog) permitem ativar features por usuário, percentual do tráfego ("rollout gradual"), ou grupo — sem nenhum deploy. Para projetos menores, variáveis de ambiente resolvem.

**No DevSuite:** o Market Pulse (feature de análise de ETFs) foi adicionado como feature separada — um caso de uso real de feature flag.

---

## 5. Idempotência — Segurança em Requisições Repetidas

Uma operação é **idempotente** se você pode executá-la múltiplas vezes com o mesmo resultado.

```
GET /projects      → idempotente (só lê)
DELETE /projects/1 → idempotente (deletado é deletado — segunda chamada é 404)
POST /projects     → NÃO idempotente (cria um novo projeto a cada chamada)
```

**Por que importa:** redes falham. O cliente não sabe se a requisição chegou. Se ele tentar de novo, você pode ter dados duplicados.

**Solução: Idempotency Key**

O cliente gera um ID único por operação. O servidor armazena esse ID — se receber o mesmo, retorna o resultado já guardado em vez de executar de novo.

```typescript
// Cliente: gera um ID único por tentativa de criação
const idempotencyKey = crypto.randomUUID(); // ou nanoid()

await api.post('/projects', data, {
  headers: { 'Idempotency-Key': idempotencyKey }
});

// Servidor: verifica se já processou esse key
async function createProject(req: Request, res: Response) {
  const key = req.headers['idempotency-key'] as string;

  if (key) {
    const cached = await redis.get(`idem:${key}`);
    if (cached) return res.json(JSON.parse(cached)); // retorna resultado anterior
  }

  const project = await prisma.project.create({ data: { ... } });

  if (key) {
    await redis.setex(`idem:${key}`, 86400, JSON.stringify(project)); // guarda por 24h
  }

  res.status(201).json(project);
}
```

**Para o DevSuite na prática:** o botão desabilitado com `isPending` já resolve o double-submit mais comum. Idempotency keys são necessárias em sistemas financeiros, e-commerce, ou qualquer lugar onde duplicatas causam prejuízo real.

---

## 6. Glossário — Termos que Sêniors Usam

Quando sêniors conversam, usam esses termos sem explicar. Agora você tem a referência.

### Performance e Infraestrutura

| Termo | O que significa |
|-------|----------------|
| **Latência** | Tempo de ida e volta de uma requisição (ex: "latência p95 de 200ms") |
| **Throughput** | Quantas requisições por segundo o sistema processa |
| **p95 / p99** | Percentil — "p95 de 200ms" = 95% das requisições completam em até 200ms. O p99 captura os piores casos |
| **Cold start** | Tempo extra quando uma função serverless é invocada após ficar ociosa |
| **TTL** | Time To Live — tempo de vida de um dado em cache antes de expirar |
| **CDN** | Content Delivery Network — rede de servidores distribuídos geograficamente para servir assets mais rápido |
| **Load balancer** | Distribui requisições entre múltiplos servidores para não sobrecarregar um só |
| **Horizontal scaling** | Adicionar mais máquinas (vs vertical = máquina mais potente) |

### Banco de Dados

| Termo | O que significa |
|-------|----------------|
| **Index** | Estrutura que acelera buscas — como o índice de um livro |
| **Full table scan** | Banco lê todas as linhas para encontrar o resultado — muito lento em tabelas grandes |
| **N+1 query** | Bug de performance: 1 query que gera N queries adicionais em loop |
| **Connection pool** | Conjunto de conexões reutilizáveis ao banco — evita overhead de criar nova conexão a cada requisição |
| **Migration** | Arquivo que descreve uma mudança no schema do banco, aplicada de forma controlada |
| **Seed** | Popular o banco com dados iniciais (para dev/teste) |
| **Upsert** | Insert or Update — cria se não existe, atualiza se existe |

### Arquitetura

| Termo | O que significa |
|-------|----------------|
| **Monolito** | Uma aplicação única que contém toda a lógica (frontend + backend juntos ou backend monolítico) |
| **Microserviços** | Aplicação dividida em serviços independentes que se comunicam via API/mensageria |
| **REST** | Estilo arquitetural para APIs: URLs representam recursos, verbos HTTP representam ações |
| **GraphQL** | Alternativa ao REST onde o cliente define exatamente quais dados quer — evita over-fetching |
| **Serverless** | Código que roda em resposta a eventos, sem gerenciar servidores. A plataforma escala automaticamente |
| **Webhook** | O oposto de uma requisição normal — o servidor externo te avisa quando algo acontece (ex: Stripe te avisa de pagamento) |
| **SDK** | Software Development Kit — biblioteca que facilita usar uma API (ex: Stripe SDK) |

### Qualidade e Processo

| Termo | O que significa |
|-------|----------------|
| **Idempotente** | Operação que pode ser repetida múltiplas vezes com o mesmo resultado |
| **Eventual consistency** | Sistemas distribuídos onde os dados ficam consistentes *eventualmente* (não imediatamente) |
| **Race condition** | Bug onde o resultado depende da ordem/timing de operações concorrentes |
| **Tech debt** | Código que funciona mas que vai custar mais para manter/mudar no futuro |
| **Refactor** | Melhorar a estrutura do código sem mudar o comportamento externo |
| **DRY** | Don't Repeat Yourself — evite duplicar lógica |
| **SOLID** | 5 princípios de design OO: Single responsibility, Open/closed, Liskov substitution, Interface segregation, Dependency inversion |
| **Code review** | Revisão do código de outro dev antes de fazer merge — detecta bugs, compartilha conhecimento |
| **PR / MR** | Pull Request / Merge Request — proposta de mudança de código para revisão antes do merge |
| **CI/CD** | Continuous Integration / Continuous Deployment — automação de testes e deploy |
| **Hotfix** | Correção urgente que vai direto para produção sem passar pelo ciclo normal |
| **Rollback** | Voltar para a versão anterior após um deploy problemático |
| **Feature flag** | Condição no código que ativa/desativa uma feature sem novo deploy |
| **Soft delete** | Marcar registro como deletado em vez de remover fisicamente do banco |
| **Idempotency key** | ID único enviado pelo cliente para garantir que uma operação não seja executada duas vezes |
| **Observability** | Capacidade de entender o que está acontecendo no sistema via logs, métricas e traces |
| **SLA** | Service Level Agreement — acordo de nível de serviço (ex: "99.9% de uptime") |
| **On-call** | Dev que está de plantão para responder a incidentes em produção |
| **Postmortem** | Documento escrito após um incidente descrevendo o que aconteceu, por que, e o que vai mudar |
