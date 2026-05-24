# FRONTEND GUIDE — SIGER

Mapa técnico completo do frontend Angular. Use este documento para navegar pelo código, entender onde cada funcionalidade está implementada e como o frontend se conecta ao backend.

---

## Stack

| Item | Versão / Tecnologia |
|------|-------------------|
| Framework | Angular 17+ (standalone components) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS + CSS variables (tema dark) |
| Reatividade | Angular Signals (`signal`, `computed`) |
| HTTP | `HttpClient` + `firstValueFrom` (Promises) |
| Autenticação | JWT via `jwtDecode` |
| Mock | `HttpInterceptorFn` (ativo quando `environment.mockApi = true`) |

---

## Estrutura de Diretórios

```
src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts          # Redireciona para /login se não autenticado
│   │   └── role.guard.ts          # Redireciona para /acesso-negado se role insuficiente
│   ├── interceptors/
│   │   ├── token.interceptor.ts   # Injeta Bearer token; remove token expirado do localStorage
│   │   ├── error.interceptor.ts   # Trata erros HTTP globalmente (401/403/404/0/500)
│   │   ├── loading.interceptor.ts # Ativa/desativa LoadingService em cada requisição
│   │   └── mock.interceptor.ts    # Simula toda a API REST (ativo com mockApi=true)
│   ├── models/
│   │   ├── enums.ts               # MeetingStatus, ParticipantRole, etc.
│   │   ├── meeting.model.ts       # Interface Meeting
│   │   ├── meeting-minutes.model.ts # Interface MeetingMinutes
│   │   ├── participant.model.ts   # Interface Participant
│   │   ├── task.model.ts          # Interface Task
│   │   ├── topic.model.ts         # Interface Topic
│   │   └── user.model.ts          # Interface User
│   └── services/
│       ├── auth.service.ts        # Login, logout, JWT, permissões
│       ├── log.service.ts         # Registra operações no /api/log
│       ├── meeting.service.ts     # CRUD /api/meeting
│       ├── meeting-minutes.service.ts # CRUD /api/meeting/minutes
│       ├── notification.service.ts # Toast notifications (sem HTTP)
│       ├── participant.service.ts # CRUD /api/participant
│       ├── task.service.ts        # CRUD /api/task
│       ├── topic.service.ts       # CRUD /api/topic
│       └── user.service.ts        # CRUD /api/user
├── layout/
│   ├── layout.ts                  # Shell: sidebar + topbar + router-outlet
│   ├── sidebar.ts                 # Navegação lateral, exibe itens por role
│   └── topbar.ts                  # Barra superior, notificações, logout
├── pages/
│   ├── auth/
│   │   ├── login/login.ts         # Formulário de login
│   │   ├── forgot-password/       # Solicitar redefinição de senha
│   │   └── reset-password/        # Redefinir senha com token
│   ├── dashboard/dashboard.ts     # Dashboard com métricas e listas rápidas
│   ├── reunioes/
│   │   ├── reunioes.routes.ts
│   │   ├── reuniao-list.ts        # Listagem com busca e filtros
│   │   ├── reuniao-form.ts        # Criar/editar reunião + participantes + pautas
│   │   └── reuniao-detalhe.ts     # Detalhes, ata, pautas, tarefas, timer
│   ├── tarefas/
│   │   ├── tarefas.routes.ts
│   │   └── tarefa-list.ts         # Kanban board (Pendente / Em andamento / Concluída)
│   ├── atas/
│   │   ├── atas.routes.ts
│   │   └── ata-list.ts            # Listagem de atas com link para reunião
│   ├── relatorios/
│   │   ├── relatorios.routes.ts
│   │   └── relatorio-list.ts      # Métricas, gráficos, heatmap
│   ├── usuarios/
│   │   ├── usuarios.routes.ts
│   │   ├── usuario-list.ts        # CRUD de usuários (ADMIN only)
│   │   └── usuario-form.ts        # Formulário criar/editar usuário
│   ├── configuracoes/configuracoes.ts # Perfil do usuário, segurança e preferências de notificação
│   └── errors/
│       ├── access-denied/         # Página 403
│       └── not-found/             # Página 404
└── shared/
    └── components/
        └── toast/toast.ts         # Componente de notificação
```

---

## Rotas

| Rota | Componente | Guard |
|------|-----------|-------|
| `/login` | Login | — |
| `/esqueci-senha` | ForgotPassword | — |
| `/redefinir-senha` | ResetPassword | — |
| `/acesso-negado` | AccessDenied | — |
| `/` | redirect → `/dashboard` | authGuard |
| `/dashboard` | Dashboard | authGuard |
| `/reunioes` | ReuniaoList | authGuard |
| `/reunioes/nova` | ReuniaoForm | authGuard |
| `/reunioes/:id` | ReuniaoDetalhe | authGuard |
| `/reunioes/:id/editar` | ReuniaoForm | authGuard |
| `/tarefas` | TarefaList | authGuard |
| `/atas` | AtaList | authGuard |
| `/relatorios` | RelatorioList | authGuard |
| `/usuarios` | UsuarioList | authGuard + roleGuard(['ROLE_ADMIN']) |
| `/configuracoes` | Configuracoes | authGuard |
| `/**` | NotFound | — |

---

## Autenticação

**Fluxo:**
1. `POST /auth/login` → recebe `{ token: string }`
2. Token armazenado em `localStorage` (chave: `environment.tokenKey`)
3. `token.interceptor.ts` injeta `Authorization: Bearer {token}` em toda requisição; se o token existe mas expirou, remove-o do localStorage automaticamente
4. `error.interceptor.ts` intercepta respostas HTTP: 401 → limpa localStorage e redireciona `/login`; 403 → redireciona `/acesso-negado`; 400/404 → toast de aviso; 0 → "Sem conexão"; 500 → toast de erro genérico
5. `AuthService.isLoggedIn()` verifica expiração do JWT (`exp * 1000 > Date.now()`)
6. `authGuard` redireciona para `/login` se não autenticado
7. `roleGuard` lê `authorities[]` do payload JWT; redireciona para `/acesso-negado` se role ausente

**JWT Payload esperado:**
```json
{
  "sub": "email@usuario.com",
  "authorities": ["ROLE_ADMIN", "ROLE_ORGANIZADOR"],
  "exp": 1234567890,
  "iat": 1234567890
}
```

**Roles reconhecidas pelo frontend:**
- `ROLE_ADMIN` — acesso a `/usuarios`, exibe "Administrador" na sidebar
- `ROLE_ORGANIZADOR` — exibe "Organizador" na sidebar
- (demais) — exibe "Participante" na sidebar

---

## Serviços e Endpoints Consumidos

### AuthService
| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/auth/login` | Login |
| POST | `/auth/forgot-password` | Solicitar redefinição |
| POST | `/auth/reset-password` | Redefinir senha |

### MeetingService
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/meeting/findAll` | Listar todas as reuniões |
| GET | `/api/meeting/{id}` | Buscar reunião por ID |
| POST | `/api/meeting` | Criar reunião |
| PUT | `/api/meeting/{id}` | Editar reunião |
| DELETE | `/api/meeting/{id}` | Excluir reunião |

### ParticipantService
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/participant/findAll` | Listar todos (filtragem client-side por meeting.id) |
| GET | `/api/participant/{id}` | Buscar por ID |
| POST | `/api/participant` | Adicionar participante |
| PUT | `/api/participant/{id}` | Atualizar participante |
| DELETE | `/api/participant/{id}` | Remover participante |

### MeetingMinutesService
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/meeting/minutes/findAll` | Listar todas as atas (filtragem client-side) |
| GET | `/api/meeting/minutes/{id}` | Buscar ata por ID |
| POST | `/api/meeting/minutes` | Criar ata |
| PUT | `/api/meeting/minutes/{id}` | Atualizar ata |
| DELETE | `/api/meeting/minutes/{id}` | Excluir ata |

### TopicService
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/topic/findAll` | Listar todos (filtragem client-side por meetingMinutes.id) |
| GET | `/api/topic/{id}` | Buscar por ID |
| POST | `/api/topic` | Criar pauta |
| PUT | `/api/topic/{id}` | Atualizar pauta / marcar concluída |
| DELETE | `/api/topic/{id}` | Excluir pauta |

### TaskService
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/task/findAll` | Listar todas (filtragem client-side por meeting.id) |
| GET | `/api/task/{id}` | Buscar por ID |
| POST | `/api/task` | Criar tarefa |
| PUT | `/api/task/{id}` | Atualizar tarefa / mover no Kanban |
| DELETE | `/api/task/{id}` | Excluir tarefa |

### UserService
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/user/findAll` | Listar usuários (ADMIN) |
| GET | `/api/user/{id}` | Buscar por ID |
| POST | `/api/user` | Criar usuário |
| PUT | `/api/user/{id}` | Editar usuário |
| DELETE | `/api/user/{id}` | Excluir usuário |

### LogService
| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/api/log` | Registrar operação (delete de reunião/usuário) |

---

## Modelos de Dados (Interfaces TypeScript)

### Meeting
```typescript
interface Meeting {
  id?: number;
  title: string;           // max 100
  description: string;     // max 255
  location: string;        // max 100
  meetingDate: string;     // ISO 8601
  duration: number;        // minutos
  status?: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  organizer?: { id: number; name?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}
```

### Participant
```typescript
interface Participant {
  id?: number;
  role: 'ORGANIZADOR' | 'PARTICIPANTE' | 'PALESTRANTE';
  participation?: 'NAO_PARTICIPOU' | 'PARTICIPOU' | 'SIM' | 'NAO' | 'TALVEZ';
  user: { id: number; name?: string; email?: string };
  meeting: { id: number };
}
```

### MeetingMinutes
```typescript
interface MeetingMinutes {
  id?: number;
  objectives: string;   // max 100
  notes: string;        // max 255
  decision: string;     // max 255
  meeting: { id: number };
  topics?: Topic[];
}
```

### Topic
```typescript
interface Topic {
  id?: number;
  title: string;        // max 100
  timer?: number;       // minutos
  orderIndex: number;
  concluded: boolean;
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  responsible?: { id: number };
  meetingMinutes: { id: number };
}
```

### Task
```typescript
interface Task {
  id?: number;
  title: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';
  dueDate?: string;     // ISO 8601 date
  assignee?: { id: number; name?: string; email?: string };
  meeting: { id: number; title?: string };
  createdAt?: string;
}
```

### User
```typescript
// Estende BaseResourceModel (contém id: number)
class User extends BaseResourceModel {
  name!: string;
  email!: string;
  password?: string;
  cpf!: string;
  phone?: string;
  type!: string;        // 'ADMIN' | 'ORGANIZADOR' | 'PARTICIPANTE'
  status!: string;      // 'ATIVO' | 'INATIVO'
  meetings?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}
```

---

## Modo Mock

Controlado por dois arquivos de environment:

**`src/environment/environment.ts`** — padrão (conecta ao backend real):
```typescript
export const environment = {
  production: false,
  apiUrl: '',           // URL do backend (configurar conforme deploy)
  mockApi: false,
  tokenKey: 'siger_token',
};
```

**`src/environment/environment.mock.ts`** — modo de desenvolvimento com mock:
```typescript
export const environment = {
  production: false,
  apiUrl: '',
  mockApi: true,        // ← ativa o mock interceptor
  tokenKey: 'siger_token',
};
```

Com `mockApi: true`, o `mock.interceptor.ts` intercepta **todas** as requisições HTTP e retorna dados em memória com delay de 300ms. O mock cobre 100% dos endpoints consumidos pelo frontend.

**Credenciais de teste (mock):**
- Admin: qualquer e-mail com "admin" (ex: `admin@siger.com`) + qualquer senha → roles `ROLE_ADMIN, ROLE_ORGANIZADOR`
- Organizador: qualquer outro e-mail + qualquer senha → role `ROLE_ORGANIZADOR`

---

## Funcionalidades por Página

### Dashboard (`/dashboard`)
- Stat cards: reuniões do mês, taxa de comparecimento, tempo médio, tarefas pendentes
- Próximas reuniões com contagem de participantes (dados reais via API)
- Gráfico de barras mensal
- Tarefas recentes não concluídas
- Confirmações pendentes (reuniões NAO_INICIADO)

### Reuniões (`/reunioes`)
- Listagem com busca por título/descrição/local
- Filtro por status (NAO_INICIADO / EM_ANDAMENTO / CONCLUIDO)
- Criar, editar, excluir reunião
- Formulário sincroniza participantes e pautas via calls separadas ao salvar

### Detalhe de Reunião (`/reunioes/:id`)
- Aba **Visão Geral**: dados da reunião, botões editar/excluir
- Aba **Participantes**: lista com role e confirmação, adicionar/remover
- Aba **Ata**: campos objectives/notes/decision com POST/PUT automático
- Aba **Pautas**: lista ordenada com prioridade, timer individual, toggle concluído
- Aba **Tarefas**: lista de tarefas da reunião, criar nova tarefa inline
- **Timer**: countdown em segundos por pauta ativo com `setInterval`, para ao zerar

### Tarefas (`/tarefas`)
- Kanban board com 3 colunas: Pendente / Em andamento / Concluída
- Filtro por reunião
- Mover tarefa entre colunas via botões (chama PUT)
- Criar nova tarefa via modal
- Excluir tarefa com confirmação

### Atas (`/atas`)
- Listagem de todas as atas com dados da reunião correspondente
- Busca por título da reunião, objetivos ou decisão
- Clique navega para `/reunioes/{id}#minutes`

### Relatórios (`/relatorios`)
- Stat cards com dados agregados das reuniões
- Gráfico de barras de comparecimento (6 meses, dados estáticos)
- Donut SVG de distribuição de status (calculado dos dados reais)
- Heatmap de melhor horário (dados estáticos representativos)

### Usuários (`/usuarios`) — ROLE_ADMIN only
- Listagem completa de usuários
- Criar, editar, excluir
- Exibe status ATIVO/INATIVO e tipo/role

### Configurações (`/configuracoes`)
- **Aba Perfil**: formulário com Nome (editável), Email (readonly), CPF (readonly), Telefone; carrega dados via `GET /api/user/findAll` filtrando pelo email do JWT; salva via `PUT /api/user/{id}`; usuários não-admin veem apenas o email (sem permissão para listar usuários)
- **Aba Segurança**: botão que chama `POST /auth/forgot-password` com o email do JWT para enviar link de redefinição
- **Aba Notificações**: 5 toggles de preferências (lembretes, convites, cancelamento, tarefas, ausência) — apenas local, sem chamada HTTP

---

## Componentes Compartilhados

| Componente | Local | Uso |
|-----------|-------|-----|
| `ToastComponent` | `shared/components/toast/toast.ts` | Notificações — injetado em qualquer página |
| `NotificationService` | `core/services/notification.service.ts` | `success()`, `error()`, `info()`, `warning()` |
