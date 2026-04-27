# SIGER — Sistema Inteligente de Gerenciamento de Reuniões

Frontend Angular do SIGER, sistema para gerenciamento de reuniões, pautas, atas, tarefas e participantes com controle de acesso por perfil (RBAC).

## Stack

- **Angular 20** — standalone components, signals, functional guards
- **Tailwind CSS v4** — utilitários + variáveis CSS customizadas
- **TypeScript 5.9** — strict mode
- **JWT** — autenticação stateless via `jwt-decode`

## Pré-requisitos

- Node.js 20+
- npm 10+

## Instalação

```bash
npm install
```

## Rodando o projeto

### Com backend (modo normal)

Requer a API `siger-api` rodando em `http://localhost:8080`.

```bash
npx ng serve
```

### Sem backend (modo mock)

Todos os endpoints são interceptados localmente com dados fake. Não precisa de nenhum serviço externo.

```bash
npx ng serve -c mock
```

**Credenciais mock:**
- E-mail contendo `admin` (ex: `admin@siger.com`) + qualquer senha → entra como **ADMIN** (acesso total)
- Qualquer outro e-mail + qualquer senha → entra como **ORGANIZADOR**

Acesse em: `http://localhost:4200`

## Build

```bash
# Produção
npx ng build

# Desenvolvimento
npx ng build --configuration development

# Mock
npx ng build --configuration mock
```

## Estrutura do projeto

```
src/app/
├── core/                        # Infraestrutura singleton
│   ├── guards/                  # auth.guard · role.guard
│   ├── interceptors/            # token · error · loading · mock
│   ├── models/                  # User · Meeting · Participant · Topic · MeetingMinutes · Task
│   └── services/                # Auth · User · Meeting · Participant · Topic
│                                # MeetingMinutes · Task · Log · Notification · Loading
├── layout/                      # Shell da aplicação (sidebar + topbar)
├── pages/
│   ├── auth/                    # login · forgot-password · reset-password
│   ├── errors/                  # access-denied · not-found
│   ├── dashboard/               # visão geral com métricas e listas
│   ├── reunioes/                # listagem · formulário · detalhe (ata, pautas, tarefas)
│   ├── tarefas/                 # kanban board
│   ├── atas/                    # listagem de atas
│   ├── relatorios/              # métricas, gráficos e heatmap
│   ├── usuarios/                # CRUD de usuários (ADMIN only)
│   └── configuracoes/           # perfil, segurança e notificações
└── shared/
    └── components/              # toast · loading
```

## Perfis de acesso

| Perfil | Acesso |
|--------|--------|
| `ROLE_ADMIN` | Todas as telas, incluindo gerenciamento de usuários |
| `ROLE_ORGANIZADOR` | Dashboard, Reuniões, Tarefas, Atas, Relatórios, Configurações |
| (outros) | Dashboard, Reuniões, Tarefas, Atas, Relatórios, Configurações |

## Fases do projeto

| Fase | Escopo | Status |
|------|--------|--------|
| 1 | Autenticação, layout, usuários | ✅ Concluída |
| 2 | Reuniões, participantes, pautas, atas | ✅ Concluída |
| 3 | Tarefas (Kanban), aba de tarefas na reunião, listagem de atas | ✅ Concluída |
| 4 | Dashboard com métricas reais, página de relatórios | ✅ Concluída |

## API

A API backend (`siger-api`) deve estar rodando em `http://localhost:8080`.

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `POST` | `/auth/login` | Autenticação | Não |
| `POST` | `/auth/forgot-password` | Solicitar redefinição de senha | Não |
| `POST` | `/auth/reset-password` | Redefinir senha | Não |
| `GET` | `/api/user/findAll` | Listar usuários | ADMIN |
| `POST` | `/api/user` | Criar usuário | Não |
| `PUT` | `/api/user/{id}` | Editar usuário | Sim |
| `DELETE` | `/api/user/{id}` | Excluir usuário | Sim |
| `GET` | `/api/meeting/findAll` | Listar reuniões | Sim |
| `GET` | `/api/meeting/{id}` | Buscar reunião | Sim |
| `POST` | `/api/meeting` | Criar reunião | Sim |
| `PUT` | `/api/meeting/{id}` | Editar reunião | Sim |
| `DELETE` | `/api/meeting/{id}` | Excluir reunião | Sim |
| `GET` | `/api/participant/findAll` | Listar participantes | Sim |
| `POST` | `/api/participant` | Adicionar participante | Sim |
| `PUT` | `/api/participant/{id}` | Atualizar participante | Sim |
| `DELETE` | `/api/participant/{id}` | Remover participante | Sim |
| `GET` | `/api/meeting/minutes/findAll` | Listar atas | Sim |
| `POST` | `/api/meeting/minutes` | Criar ata | Sim |
| `PUT` | `/api/meeting/minutes/{id}` | Atualizar ata | Sim |
| `GET` | `/api/topic/findAll` | Listar pautas | Sim |
| `POST` | `/api/topic` | Criar pauta | Sim |
| `PUT` | `/api/topic/{id}` | Atualizar pauta | Sim |
| `DELETE` | `/api/topic/{id}` | Excluir pauta | Sim |
| `GET` | `/api/task/findAll` | Listar tarefas | Sim |
| `POST` | `/api/task` | Criar tarefa | Sim |
| `PUT` | `/api/task/{id}` | Atualizar tarefa | Sim |
| `DELETE` | `/api/task/{id}` | Excluir tarefa | Sim |
| `POST` | `/api/log` | Registrar operação | Sim |

> ⚠️ `/api/task` não existe ainda no backend — ver `BACKEND_GUIDE.md` para o contrato completo.
