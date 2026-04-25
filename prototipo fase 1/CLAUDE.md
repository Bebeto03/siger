# SIGER — Sistema Inteligente de Gerenciamento de Reuniões

## Visão Geral

SIGER é um sistema de gerenciamento de reuniões com controle de acesso por papéis (RBAC). Este repositório contém o **backend** em Java/Spring Boot. O frontend deve consumir esta API REST.

**API Base URL:** `http://localhost:8080`  
**Swagger UI:** `http://localhost:8080/swagger-ui.html`  
**OpenAPI JSON:** `http://localhost:8080/v3/api-docs`

---

## Stack do Backend

| Camada | Tecnologia |
|--------|-----------|
| Linguagem | Java 21 |
| Framework | Spring Boot 3.3.5 |
| ORM | Spring Data JPA / Hibernate |
| Banco de Dados | PostgreSQL (porta 5433, schema `bd_siger`) |
| Autenticação | JWT (HMAC256, expiração 2h) |
| Segurança | Spring Security + BCrypt |
| Migrações | Flyway (V001–V007) |
| E-mail | Mailtrap sandbox |
| Documentação | SpringDoc OpenAPI / Swagger |

---

## Autenticação

### Fluxo

1. `POST /auth/login` → recebe JWT token
2. Armazenar token no `localStorage` ou `sessionStorage`
3. Enviar em todas as requisições protegidas: `Authorization: Bearer {token}`

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Resposta:** string com o JWT token.

### Recuperação de Senha

```http
POST /auth/forgot-password
Content-Type: application/json

{ "email": "usuario@email.com" }
```

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "uuid-do-token",
  "newPassword": "novaSenha123"
}
```

Token expira em **1 hora** e é de uso único.

### Endpoints Públicos (sem token)

- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /api/user` (criação de usuário)
- Swagger: `/swagger-ui.html`, `/v3/api-docs`, `/swagger-ui/**`, `/swagger-resources/**`

---

## Papéis de Usuário (Roles)

| Role | Permissões |
|------|-----------|
| `ADMIN` | Acesso total, incluindo listagem de usuários e operações administrativas |
| `ORGANIZADOR` | Criar e gerenciar reuniões, pautas e atas |
| `PARTICIPANTE` | Visualizar reuniões das quais participa |

---

## Endpoints da API

### Usuários `/api/user`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/user` | Criar usuário | Não |
| GET | `/api/user/{id}` | Buscar usuário por ID | Sim (ADMIN) |
| PUT | `/api/user/{id}` | Atualizar usuário | Sim |
| DELETE | `/api/user/{id}` | Deletar usuário | Sim |
| GET | `/api/user/findAll` | Listar todos os usuários | Sim (ADMIN) |

### Reuniões `/api/meeting`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/meeting` | Criar reunião | Sim |
| GET | `/api/meeting/{id}` | Buscar reunião por ID | Sim |
| PUT | `/api/meeting/{id}` | Atualizar reunião | Sim |
| DELETE | `/api/meeting/{id}` | Deletar reunião | Sim |
| GET | `/api/meeting/findAll` | Listar todas as reuniões | Sim |

### Participantes `/api/participant`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/participant` | Adicionar participante | Sim |
| GET | `/api/participant/{id}` | Buscar participante por ID | Sim |
| PUT | `/api/participant/{id}` | Atualizar participante | Sim |
| DELETE | `/api/participant/{id}` | Remover participante | Sim |
| GET | `/api/participant/findAll` | Listar todos os participantes | Sim |

### Pautas `/api/topic`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/topic` | Criar pauta | Sim |
| GET | `/api/topic/{id}` | Buscar pauta por ID | Sim |
| PUT | `/api/topic/{id}` | Atualizar pauta | Sim |
| DELETE | `/api/topic/{id}` | Deletar pauta | Sim |
| GET | `/api/topic/findAll` | Listar todas as pautas | Sim |

### Atas de Reunião `/api/meeting/minutes`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/meeting/minutes` | Criar ata | Sim |
| GET | `/api/meeting/minutes/{id}` | Buscar ata por ID | Sim |
| PUT | `/api/meeting/minutes/{id}` | Atualizar ata | Sim |
| DELETE | `/api/meeting/minutes/{id}` | Deletar ata | Sim |
| GET | `/api/meeting/minutes/findAll` | Listar todas as atas | Sim |

### Logs `/api/log`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/log` | Registrar log de operação | Sim |

---

## Modelos de Dados

### User

```json
{
  "id": 1,
  "name": "string",
  "email": "string",
  "cpf": "string (11 chars)",
  "phone": "string (11 chars)",
  "status": "ATIVO | INATIVO",
  "type": "ADMIN | ORGANIZADOR | PARTICIPANTE",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "lastLogin": "ISO 8601"
}
```

### Meeting

```json
{
  "id": 1,
  "title": "string (max 100)",
  "description": "string (max 255)",
  "location": "string (max 100)",
  "meetingDate": "ISO 8601",
  "duration": 60,
  "status": "NAO_INICIADO | EM_ANDAMENTO | CONCLUIDO",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "organizer": { "id": 1 }
}
```

### Participant

```json
{
  "id": 1,
  "role": "ORGANIZADOR | PARTICIPANTE | PALESTRANTE",
  "participation": "NAO_PARTICIPOU | PARTICIPOU | SIM | NAO | TALVEZ",
  "user": { "id": 1 },
  "meeting": { "id": 1 }
}
```

### Topic (Pauta)

```json
{
  "id": 1,
  "title": "string (max 100)",
  "timer": "opcional",
  "orderIndex": 1,
  "concluded": false,
  "priority": "ALTA | MEDIA | BAIXA",
  "responsible": { "id": 1 },
  "meetingMinutes": { "id": 1 }
}
```

### MeetingMinutes (Ata)

```json
{
  "id": 1,
  "objectives": "string (max 100)",
  "notes": "string (max 255)",
  "decision": "string (max 255)",
  "meeting": { "id": 1 },
  "topics": [ ]
}
```

### Log

```json
{
  "id": 1,
  "operation": "string (max 100)",
  "userName": "string (max 100)",
  "date": "ISO 8601 timestamp"
}
```

---

## Tratamento de Erros no Frontend

| Status HTTP | Significado | Ação Recomendada |
|-------------|-------------|------------------|
| 200 | OK | Sucesso |
| 201 | Created | Recurso criado com sucesso |
| 400 | Bad Request | Dados inválidos — mostrar mensagem de validação |
| 401 | Unauthorized | Token expirado ou inválido — redirecionar para login |
| 403 | Forbidden | Sem permissão (role insuficiente) — mostrar mensagem de acesso negado |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Erro no servidor — mostrar mensagem genérica |

---

## Convenções da API

- Todos os dados em **JSON** (`Content-Type: application/json`)
- IDs são **Long** (inteiros)
- Timestamps em **ISO 8601** (`LocalDateTime`)
- Enums retornados como **strings** (ex: `"ATIVO"`, `"ADMIN"`)
- Listagens via `GET /api/{entidade}/findAll`
- Criação retorna **201 Created**

---

## Rodando o Backend Localmente

**Pré-requisitos:** Java 21, PostgreSQL na porta 5433, Maven

```bash
# Na pasta do projeto backend
cd siger-api

# Rodar a aplicação
mvn spring-boot:run
```

**Variáveis de ambiente opcionais:**

```
JWT_SECRET=seu-segredo-aqui
```

O banco de dados é criado automaticamente via Flyway ao iniciar a aplicação.

---

## Fluxo Principal da Aplicação

```
Usuário faz login
  └─> Recebe JWT token
        └─> Cria/Busca Reunião
              └─> Adiciona Participantes
                    └─> Cria Pautas (Topics) na Ata
                          └─> Registra Ata (MeetingMinutes)
                                └─> Acompanha status da Reunião
```
