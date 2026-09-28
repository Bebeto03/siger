# BACKEND GUIDE — SIGER

O que o backend precisa implementar para cobrir 100% do frontend. Este documento lista endpoints, contratos de request/response, regras de negócio e observações críticas para cada recurso consumido pelo frontend Angular.

---

## Resumo Rápido

| Recurso | Endpoints | Status |
|---------|-----------|--------|
| Auth | login, forgot-password, reset-password | ✅ Já existe |
| Usuários | CRUD + findAll | ✅ Já existe |
| Reuniões | CRUD + findAll | ✅ Já existe |
| Participantes | CRUD + findAll | ✅ Já existe |
| Atas (MeetingMinutes) | CRUD + findAll | ✅ Já existe |
| Pautas (Topic) | CRUD + findAll | ✅ Já existe |
| Logs | POST | ✅ Já existe |
| Notificações | listar, contagem, marcar lida | ✅ Já existe |
| **Tarefas (Task)** | **CRUD + findAll** | ❌ **NÃO EXISTE — precisa ser criado** |

---

## ❌ CRÍTICO — Endpoint de Tarefas (Task)

Este é o único recurso que **não existe no backend** e precisa ser implementado do zero.

### Modelo de dados

```java
@Entity
public class Task {
    @Id @GeneratedValue
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status; // PENDENTE | EM_ANDAMENTO | CONCLUIDA

    @Column
    private LocalDate dueDate;

    @ManyToOne
    @JoinColumn(name = "assignee_id")
    private User assignee; // nullable

    @ManyToOne(optional = false)
    @JoinColumn(name = "meeting_id")
    private Meeting meeting;

    @Column(updatable = false)
    private LocalDateTime createdAt;
}
```

```java
public enum TaskStatus {
    PENDENTE, EM_ANDAMENTO, CONCLUIDA
}
```

### Endpoints necessários

#### `GET /api/task/findAll`
Retorna todas as tarefas. O frontend filtra client-side por `meeting.id`.

**Response 200:**
```json
[
  {
    "id": 1,
    "title": "Atualizar doc de requisitos",
    "status": "PENDENTE",
    "dueDate": "2026-04-30",
    "assignee": { "id": 3, "name": "Maria Silva", "email": "maria@siger.com" },
    "meeting": { "id": 1, "title": "Sprint Planning S4" },
    "createdAt": "2026-04-26T10:00:00"
  }
]
```

#### `GET /api/task/{id}`
**Response 200:** objeto Task completo  
**Response 404:** task não encontrada

#### `POST /api/task`
**Request body:**
```json
{
  "title": "Atualizar doc de requisitos",
  "status": "PENDENTE",
  "dueDate": "2026-04-30",
  "assignee": { "id": 3 },
  "meeting": { "id": 1 }
}
```
**Response 201:** objeto Task criado com `id` e `createdAt` preenchidos

#### `PUT /api/task/{id}`
Atualiza qualquer campo. Usado pelo frontend para:
- Mover tarefa entre colunas Kanban (atualiza `status`)
- Editar título/prazo/responsável

**Request body:** mesmos campos do POST (parcial aceito)  
**Response 200:** objeto Task atualizado

#### `DELETE /api/task/{id}`
**Response 204:** sem corpo

### Segurança
- Requer JWT válido (`Authorization: Bearer {token}`)
- Qualquer role autenticada pode criar/editar/excluir tarefas

---

## ✅ Auth

### `POST /auth/login`
**Request:**
```json
{ "email": "user@email.com", "password": "senha123" }
```
**Response 200:**
```json
{ "token": "eyJ..." }
```
> ⚠️ O frontend espera um objeto `{ token: string }`, **não** uma string pura.

**JWT payload deve conter:**
```json
{
  "sub": "email@usuario.com",
  "authorities": ["ROLE_ADMIN", "ROLE_ORGANIZADOR"],
  "exp": 1234567890,
  "iat": 1234567890
}
```

**Roles reconhecidas pelo frontend:**
- `ROLE_ADMIN` — desbloqueia rota `/usuarios` e item na sidebar
- `ROLE_ORGANIZADOR` — exibe label "Organizador"
- Qualquer outra — exibe label "Participante"

### `POST /auth/forgot-password`
```json
{ "email": "user@email.com" }
```
Response: qualquer 200/201.

### `POST /auth/reset-password`
```json
{ "token": "uuid-do-token", "newPassword": "novaSenha123" }
```
Response: qualquer 200/201.

---

## ✅ Usuários `/api/user`

### Estrutura retornada
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "cpf": "00000000001",
  "phone": "11999990001",
  "status": "ATIVO",
  "type": "ORGANIZADOR",
  "createdAt": "2026-01-01T00:00:00",
  "updatedAt": "2026-01-01T00:00:00"
}
```

**Campos usados no frontend:**
- `id`, `name`, `email`, `cpf`, `phone`, `status`, `type`
- `status`: `ATIVO | INATIVO`
- `type`: `ADMIN | ORGANIZADOR | PARTICIPANTE`

**Endpoints:**
- `GET /api/user/findAll` — lista todos (ADMIN only)
- `GET /api/user/{id}`
- `POST /api/user` — público (sem token)
- `PUT /api/user/{id}`
- `DELETE /api/user/{id}`

> ⚠️ **Observação — Página de Configurações:** A página `/configuracoes` usa `GET /api/user/findAll` para carregar o perfil do usuário logado (filtra client-side pelo email do JWT). Isso significa que **usuários não-admin não conseguem ver/editar o próprio perfil**, pois o endpoint `findAll` exige `ROLE_ADMIN`. Se quiser que todos os usuários possam editar seu perfil, implementar `GET /api/user/me` que retorna o usuário autenticado pelo token JWT — seria o endpoint ideal e eliminaria a dependência de `findAll` na tela de configurações.

---

## ✅ Reuniões `/api/meeting`

### Estrutura retornada
```json
{
  "id": 1,
  "title": "Sprint Planning",
  "description": "Planejamento do sprint",
  "location": "Sala Virtual 1",
  "meetingDate": "2026-04-28T09:00:00",
  "duration": 60,
  "status": "NAO_INICIADO",
  "organizer": { "id": 2, "name": "João Org", "email": "joao@siger.com" },
  "createdAt": "2026-04-01T00:00:00",
  "updatedAt": "2026-04-01T00:00:00"
}
```

**Status enum:** `NAO_INICIADO | EM_ANDAMENTO | CONCLUIDO`

**Campos críticos para o frontend:**
- `organizer.name` e `organizer.email` são exibidos na listagem e detalhe
- `duration` é usado no timer de pautas (minutos)
- `status` controla cores, badges e filtros em todas as páginas

**Endpoints:**
- `GET /api/meeting/findAll`
- `GET /api/meeting/{id}`
- `POST /api/meeting` → **201 Created**
- `PUT /api/meeting/{id}`
- `DELETE /api/meeting/{id}`

---

## ✅ Participantes `/api/participant`

### Estrutura retornada
```json
{
  "id": 1,
  "role": "ORGANIZADOR",
  "participation": "SIM",
  "user": { "id": 2, "name": "João Org", "email": "joao@siger.com" },
  "meeting": { "id": 1 }
}
```

**role enum:** `ORGANIZADOR | PARTICIPANTE | PALESTRANTE`  
**participation enum:** `NAO_PARTICIPOU | PARTICIPOU | SIM | NAO | TALVEZ`

> ⚠️ O frontend filtra participantes de uma reunião via `findAll` + filter client-side por `meeting.id`. Se o volume de participantes for alto, considere um endpoint `/api/participant/findByMeeting/{meetingId}`.

**Campos críticos:**
- `user.name` e `user.email` são exibidos na aba Participantes do detalhe
- `participation` é editável pelo usuário no detalhe da reunião

**Endpoints:**
- `GET /api/participant/findAll`
- `GET /api/participant/{id}`
- `POST /api/participant` → **201 Created**
- `PUT /api/participant/{id}`
- `DELETE /api/participant/{id}`

---

## ✅ Atas `/api/meeting/minutes`

### Estrutura retornada
```json
{
  "id": 1,
  "objectives": "Definir escopo do sprint",
  "notes": "Revisão do backlog concluída.",
  "decision": "Sprint focado em módulo de relatórios.",
  "meeting": { "id": 1 },
  "topics": []
}
```

> ⚠️ O frontend filtra a ata de uma reunião via `findAll` + filter client-side por `meeting.id`. Cada reunião possui **no máximo uma ata**. Se não existir ata, o frontend chama POST; se existir, chama PUT.

**Endpoints:**
- `GET /api/meeting/minutes/findAll`
- `GET /api/meeting/minutes/{id}`
- `POST /api/meeting/minutes` → **201 Created**
- `PUT /api/meeting/minutes/{id}`
- `DELETE /api/meeting/minutes/{id}`

---

## ✅ Pautas `/api/topic`

### Estrutura retornada
```json
{
  "id": 1,
  "title": "Revisão do backlog",
  "timer": 15,
  "orderIndex": 1,
  "concluded": false,
  "priority": "ALTA",
  "responsible": { "id": 2 },
  "meetingMinutes": { "id": 1 }
}
```

**priority enum:** `ALTA | MEDIA | BAIXA`

> ⚠️ O frontend filtra pautas de uma ata via `findAll` + filter client-side por `meetingMinutes.id`.

**Uso de `concluded`:** o frontend chama `PUT /api/topic/{id}` com `{ concluded: true/false }` ao clicar no checkbox de pauta. O backend deve aceitar atualização parcial ou manter os demais campos.

**Endpoints:**
- `GET /api/topic/findAll`
- `GET /api/topic/{id}`
- `POST /api/topic` → **201 Created**
- `PUT /api/topic/{id}`
- `DELETE /api/topic/{id}`

---

## ✅ Logs `/api/log`

### Estrutura enviada
```json
{
  "operation": "DELETE_MEETING: Sprint Planning",
  "userName": "admin@siger.com",
  "date": "2026-04-26T15:30:00.000Z"
}
```

O frontend envia logs nas seguintes operações:
- Excluir reunião
- Excluir usuário

**Endpoint:**
- `POST /api/log` → resposta 200 ou 201, body ignorado pelo frontend

---

## ✅ Notificações `/api/notification`

Lembretes de reunião exibidos no sino do topbar. O backend cria uma notificação (e envia e-mail) para cada participante com presença `SIM` ou ainda não respondida (`TALVEZ`), **24h e 1h antes** de reuniões `NAO_INICIADO`. Todos os endpoints são do usuário logado (JWT); só é possível ler/alterar as próprias notificações.

### Estrutura retornada
```json
{
  "id": 12,
  "meetingId": 4,
  "type": "MEETING_REMINDER",
  "title": "Reunião em 1 hora",
  "message": "\"Kickoff — Módulo de IA\" - 30/04/2026 às 10:00. Você ainda não confirmou sua presença.",
  "read": false,
  "createdAt": "2026-04-30T09:00:03"
}
```

### Tipos (`type`)
| Tipo | Destinatário | Quando |
|------|--------------|--------|
| `MEETING_REMINDER` | Participante | 24h e 1h antes (presença `SIM` ou sem resposta) |
| `ORGANIZER_NO_CONFIRMATION` | Organizador da reunião | 1h antes, se **nenhum participante** confirmou presença (`SIM`). A linha do próprio organizador não conta como confirmação. Vale também para reunião sem convidados. Também enviado por e-mail |

O alerta é enviado uma única vez por reunião/data (`tb_meeting_organizer_alert`); se a reunião for remarcada, um novo alerta volta a valer. Reuniões `CANCELADO` ou com organizador `INATIVO` não geram alerta.

**Endpoints:**
- `GET /api/notification` → últimas 30 notificações do usuário, mais recentes primeiro
- `GET /api/notification/unread-count` → `{ "count": 3 }`
- `PATCH /api/notification/{id}/read` → notificação atualizada (403 se for de outro usuário, 404 se não existir)
- `PATCH /api/notification/read-all` → 204

O frontend consulta a lista e a contagem a cada 60s (`NotificacaoService`), com a aba visível, usando `BACKGROUND_REQUEST` para não exibir loading nem toasts de erro.

---

## Tratamento de Erros HTTP (Frontend)

O `error.interceptor.ts` processa automaticamente toda resposta de erro:

| Status | Comportamento no Frontend |
|--------|--------------------------|
| 401 | Limpa localStorage + redireciona `/login` |
| 403 | Redireciona `/acesso-negado` |
| 400 | Toast de aviso com `err.error?.message` |
| 404 | Toast "Recurso não encontrado." |
| 0 | Toast "Sem conexão com o servidor." |
| outros | Toast "Erro interno do servidor. Tente novamente." |

> Portanto, para erros de validação (400), retornar sempre `{ "message": "descrição do erro" }` para o frontend exibir a mensagem correta.

---

## Convenções Importantes

| Convenção | Valor |
|-----------|-------|
| Content-Type | `application/json` |
| IDs | `Long` (inteiros) |
| Timestamps | ISO 8601 (`LocalDateTime`) |
| Datas simples | ISO 8601 date (`LocalDate`, ex: `"2026-04-30"`) |
| Enums | Strings uppercase (ex: `"ATIVO"`, `"NAO_INICIADO"`) |
| Criação | Retorna **201 Created** com o objeto criado |
| Listagem | `GET /api/{entidade}/findAll` |
| Erro 401 | Frontend redireciona automaticamente para `/login` |
| Erro 403 | Frontend redireciona para `/acesso-negado` |

---

## Checklist de Implementação

- [ ] Criar entidade `Task` + enum `TaskStatus`
- [ ] Criar `TaskRepository`
- [ ] Criar `TaskService` com CRUD
- [ ] Criar `TaskController` com endpoints `findAll`, `{id}`, POST, PUT, DELETE
- [ ] Aplicar segurança JWT no `TaskController` (qualquer role autenticada)
- [ ] Confirmar que `POST /auth/login` retorna `{ "token": "..." }` (objeto, não string pura)
- [ ] Confirmar que JWT payload contém campo `authorities` como array de strings com prefixo `ROLE_`
- [ ] Confirmar que `GET /api/participant/findAll` retorna `user.name` e `user.email` populados
- [ ] Confirmar que `GET /api/meeting/findAll` retorna `organizer.name` e `organizer.email` populados
- [ ] Confirmar que `PUT /api/topic/{id}` aceita atualização parcial (apenas `concluded`)
