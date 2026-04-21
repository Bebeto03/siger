# SIGER Frontend — Checklist Fase 1

> **Escopo da Fase 1:** Fundação, Autenticação, Layout e Gerenciamento de Usuários  
> **Stack:** Angular 21 · Tailwind CSS · Guards · Interceptors  
> **Referência visual:** `/FRONT_PROTOTIPO/siger-prototype.jsx`  
> **API Base:** `http://localhost:8080`

---

## 1. Configuração do Projeto

- [ ] Instalar e configurar Tailwind CSS v4 (com `@tailwindcss/vite`)
- [ ] Criar `src/environments/environment.ts` e `environment.prod.ts` com `apiUrl` e flags
- [ ] Definir paleta de cores do protótipo como variáveis CSS (`--color-bg`, `--color-surface`, `--color-primary`, etc.)
- [ ] Configurar `provideHttpClient(withInterceptors([...]))` no `app.config.ts`
- [ ] Configurar roteamento principal (`app.routes.ts`) com lazy loading
- [ ] Ajustar `tsconfig.json` para `strictNullChecks` e `strictTemplates`

---

## 2. Modelos e Serviços Base

- [ ] Revisar/validar modelos existentes: `User`, `Meeting`, `Participant`, `Topic`, `MeetingMinutes`
- [ ] Criar `UserService` extendendo `BaseResourceService<User>` (`/api/user`)
- [ ] Criar `AuthService` com métodos: `login()`, `logout()`, `forgotPassword()`, `resetPassword()`
- [ ] `AuthService`: armazenar/recuperar JWT do `localStorage`, decodificar payload, expor `currentUser$`
- [ ] `AuthService`: método `hasRole(role)` para verificar permissões

---

## 3. Autenticação — Telas

### 3.1 Login
- [ ] Componente `LoginComponent` (`/login`) fiel ao protótipo (painel esquerdo + formulário direito)
- [ ] Formulário reativo com validação: email e senha obrigatórios
- [ ] Integração com `POST /auth/login` → armazenar token → redirecionar para dashboard
- [ ] Exibir mensagem de erro em caso de credenciais inválidas

### 3.2 Cadastro (aba "Cadastrar" na tela de Login)
- [ ] Formulário reativo: nome, CPF (máscara), email, senha, perfil (select)
- [ ] Integração com `POST /api/user` (endpoint público)
- [ ] Validação de CPF (11 dígitos) e senha (mínimo 8 caracteres)
- [ ] Feedback de sucesso/erro

### 3.3 Recuperação de Senha
- [ ] Tela `ForgotPasswordComponent` (`/forgot-password`)
- [ ] Integração com `POST /auth/forgot-password`
- [ ] Tela `ResetPasswordComponent` (`/reset-password?token=...`)
- [ ] Integração com `POST /auth/reset-password`

---

## 4. Guards

- [ ] **`AuthGuard`** (`canActivate`): verifica se há token válido; redireciona para `/login` se não
- [ ] **`RoleGuard`** (`canActivate`): verifica role do usuário via `AuthService.hasRole()`; redireciona para `/acesso-negado` se insuficiente
- [ ] **`UnsavedChangesGuard`** (`canDeactivate`): impede saída de formulários com alterações não salvas
- [ ] Aplicar `AuthGuard` em todas as rotas do layout protegido
- [ ] Aplicar `RoleGuard` nas rotas exclusivas de `ADMIN`

---

## 5. Interceptors

- [ ] **`TokenInterceptor`**: injeta `Authorization: Bearer {token}` em todas as requisições autenticadas
- [ ] **`ErrorInterceptor`**: trata respostas HTTP globalmente:
  - `401` → limpar token + redirecionar para `/login`
  - `403` → redirecionar para `/acesso-negado`
  - `400` → exibir mensagem de validação via `NotificationService`
  - `500` → exibir mensagem genérica de erro

---

## 6. Serviço de Notificação / Toast

- [ ] Criar `NotificationService` com métodos: `success()`, `error()`, `warning()`, `info()`
- [ ] Criar componente `ToastComponent` (canto inferior direito, auto-dismiss em 4s)
- [ ] Integrar com `ErrorInterceptor` e com os formulários

---

## 7. Layout Principal

- [ ] **`AppLayoutComponent`**: shell com sidebar + topbar + `<router-outlet>`
- [ ] **`SidebarComponent`**: colapsável, itens de navegação conforme protótipo, avatar do usuário logado na base
  - Itens: Dashboard · Reuniões · Tarefas · Atas · Relatórios · Usuários (só ADMIN) · Configurações
- [ ] **`TopbarComponent`**: título da página, ícone de notificações, botão de logout
- [ ] Rotas filhas do layout aplicando `AuthGuard`
- [ ] Componente `AccessDeniedComponent` (`/acesso-negado`) com botão "Voltar"
- [ ] Componente `NotFoundComponent` (`/404`) — wildcard `**`

---

## 8. Gerenciamento de Usuários (ADMIN)

### 8.1 Listagem
- [ ] `UserListComponent` (`/usuarios`) com tabela fiel ao protótipo
- [ ] Colunas: avatar, nome/email, perfil (badge), status (badge), ações (editar/excluir)
- [ ] Integração com `GET /api/user/findAll`
- [ ] Busca/filtro local por nome ou email
- [ ] Confirmação antes de excluir (modal simples)
- [ ] Protegido por `RoleGuard` → apenas `ADMIN`

### 8.2 Criação / Edição
- [ ] `UserFormComponent` (modal ou rota `/usuarios/novo` e `/usuarios/:id`)
- [ ] Campos: nome, email, CPF, telefone, senha (só criação), tipo (select)
- [ ] Integração com `POST /api/user` (criar) e `PUT /api/user/:id` (editar)
- [ ] Aplicar `UnsavedChangesGuard`

---

## 9. Perfil & Configurações

- [ ] `ProfileComponent` (`/configuracoes`) com dados do usuário logado
- [ ] Seção "Perfil": editar nome, email, CPF, telefone → `PUT /api/user/:id`
- [ ] Seção "Segurança": alterar senha (campo atual + nova + confirmação)
- [ ] Seção "Notificações": toggles de preferência (apenas UI por ora, sem integração)

---

## 10. Loading Global

- [ ] `LoadingService` com `BehaviorSubject<boolean>` (já existe — revisar)
- [ ] `LoadingInterceptor`: ativa/desativa loading em cada requisição HTTP
- [ ] `LoadingComponent`: overlay com spinner centralizado

---

## Critérios de Conclusão da Fase 1

- [ ] Usuário consegue fazer login e logout
- [ ] Token JWT é enviado automaticamente em todas as requisições
- [ ] Erro 401 redireciona para login automaticamente
- [ ] ADMIN consegue listar, criar, editar e excluir usuários
- [ ] Rotas protegidas bloqueiam acesso sem autenticação
- [ ] Usuário sem permissão vê a tela de "Acesso Negado"
- [ ] Formulários com dados não salvos perguntam antes de sair
- [ ] Feedback visual (toast) em todas as operações CRUD
- [ ] Layout responsivo com sidebar colapsável funcional
- [ ] Build de produção sem erros (`ng build`)

---

## Ordem de Implementação Sugerida

```
1. Setup (Tailwind + environment + app.config.ts)
2. Models + AuthService
3. Login / Cadastro / Recuperação de Senha
4. Guards + Interceptors
5. Layout (Sidebar + Topbar)
6. NotificationService + LoadingService
7. Usuários (lista + formulário)
8. Perfil/Configurações
9. Testes manuais dos critérios de conclusão
```
