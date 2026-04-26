import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, delay } from 'rxjs';
import { environment } from '../../../environment/environment';

// ─── Fake JWT ────────────────────────────────────────────────────────────────

function buildFakeJwt(email: string, roles: string[]): string {
  const b64 = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const header  = b64({ alg: 'HS256', typ: 'JWT' });
  const payload = b64({
    sub: email,
    authorities: roles,
    exp: Math.floor(Date.now() / 1000) + 86400 * 365,
    iat: Math.floor(Date.now() / 1000),
  });

  return `${header}.${payload}.mock_signature`;
}

// ─── Fake Users ──────────────────────────────────────────────────────────────

let mockUsers = [
  { id: 1, name: 'Admin Sistema',    email: 'admin@siger.com',  cpf: '00000000001', phone: '(11) 99999-0001', type: 'ADMIN',        status: 'ATIVO',   meetings: 42 },
  { id: 2, name: 'João Organizador', email: 'joao@siger.com',   cpf: '00000000002', phone: '(11) 99999-0002', type: 'ORGANIZADOR',  status: 'ATIVO',   meetings: 28 },
  { id: 3, name: 'Maria Silva',      email: 'maria@siger.com',  cpf: '00000000003', phone: '(11) 99999-0003', type: 'PARTICIPANTE', status: 'ATIVO',   meetings: 15 },
  { id: 4, name: 'Carlos Souza',     email: 'carlos@siger.com', cpf: '00000000004', phone: '(11) 99999-0004', type: 'PARTICIPANTE', status: 'INATIVO', meetings:  3 },
  { id: 5, name: 'Ana Pereira',      email: 'ana@siger.com',    cpf: '00000000005', phone: '(11) 99999-0005', type: 'ORGANIZADOR',  status: 'ATIVO',   meetings: 19 },
];

let nextUserId = 6;

// ─── Fake Meetings ───────────────────────────────────────────────────────────

let mockMeetings: any[] = [
  {
    id: 1,
    title: 'Sprint Planning S4',
    description: 'Planejamento das atividades do sprint 4. Definição de tarefas prioritárias, revisão do backlog e distribuição de responsabilidades.',
    location: 'Sala Virtual 1',
    meetingDate: '2026-04-28T09:00:00',
    duration: 60,
    status: 'AGENDADA',
    user: { id: 2, name: 'João Organizador', email: 'joao@siger.com' },
    participants: [
      { id: 1, name: 'Maria Silva',      email: 'maria@siger.com',  role: 'PARTICIPANTE',  status: 'SIM'    },
      { id: 2, name: 'Carlos Souza',     email: 'carlos@siger.com', role: 'PARTICIPANTE',  status: 'TALVEZ' },
      { id: 3, name: 'Ana Pereira',      email: 'ana@siger.com',    role: 'PARTICIPANTE',  status: 'SIM'    },
      { id: 4, name: 'João Organizador', email: 'joao@siger.com',   role: 'ORGANIZADOR',   status: 'SIM'    },
    ],
    topics: [
      { id: 1, title: 'Revisão do backlog',          priority: 'ALTA',  timer: 15, orderIndex: 1, concluded: false },
      { id: 2, title: 'Definição de metas do sprint', priority: 'ALTA',  timer: 20, orderIndex: 2, concluded: false },
      { id: 3, title: 'Distribuição de tarefas',      priority: 'MEDIA', timer: 15, orderIndex: 3, concluded: false },
    ],
  },
  {
    id: 2,
    title: 'Review de Ata — Projeto X',
    description: 'Revisão da ata e pautas pendentes do projeto X. Alinhamento entre equipes.',
    location: 'Sala 3B',
    meetingDate: '2026-04-28T14:00:00',
    duration: 45,
    status: 'AGENDADA',
    user: { id: 5, name: 'Ana Pereira', email: 'ana@siger.com' },
    participants: [
      { id: 5, name: 'Ana Pereira',      email: 'ana@siger.com',    role: 'ORGANIZADOR',  status: 'SIM' },
      { id: 6, name: 'Maria Silva',      email: 'maria@siger.com',  role: 'PARTICIPANTE', status: 'SIM' },
      { id: 7, name: 'João Organizador', email: 'joao@siger.com',   role: 'PARTICIPANTE', status: 'SIM' },
    ],
    topics: [
      { id: 4, title: 'Revisão de pendências', priority: 'ALTA',  timer: 20, orderIndex: 1, concluded: false },
      { id: 5, title: 'Próximos passos',        priority: 'MEDIA', timer: 15, orderIndex: 2, concluded: false },
    ],
  },
  {
    id: 3,
    title: 'Retrospectiva S3',
    description: 'Pontos positivos e melhorias identificados no sprint 3. O que manter, parar e iniciar.',
    location: 'Sala Virtual 2',
    meetingDate: '2026-04-25T16:00:00',
    duration: 60,
    status: 'FINALIZADA',
    user: { id: 2, name: 'João Organizador', email: 'joao@siger.com' },
    participants: [
      { id: 8,  name: 'João Organizador', email: 'joao@siger.com',   role: 'ORGANIZADOR',  status: 'SIM' },
      { id: 9,  name: 'Maria Silva',      email: 'maria@siger.com',  role: 'PARTICIPANTE', status: 'SIM' },
      { id: 10, name: 'Carlos Souza',     email: 'carlos@siger.com', role: 'PARTICIPANTE', status: 'SIM' },
      { id: 11, name: 'Ana Pereira',      email: 'ana@siger.com',    role: 'PARTICIPANTE', status: 'NAO' },
    ],
    topics: [
      { id: 6, title: 'O que funcionou bem',     priority: 'MEDIA', timer: 15, orderIndex: 1, concluded: true  },
      { id: 7, title: 'O que pode melhorar',      priority: 'ALTA',  timer: 20, orderIndex: 2, concluded: true  },
      { id: 8, title: 'Ações para o próximo sprint', priority: 'ALTA', timer: 15, orderIndex: 3, concluded: true },
    ],
  },
  {
    id: 4,
    title: 'Kickoff — Módulo de IA',
    description: 'Início do desenvolvimento do módulo de resumo via IA. Definição de escopo, tecnologias e responsáveis.',
    location: 'Auditório',
    meetingDate: '2026-04-30T10:00:00',
    duration: 90,
    status: 'AGENDADA',
    user: { id: 2, name: 'João Organizador', email: 'joao@siger.com' },
    participants: [
      { id: 12, name: 'João Organizador', email: 'joao@siger.com',   role: 'ORGANIZADOR',  status: 'SIM'    },
      { id: 13, name: 'Maria Silva',      email: 'maria@siger.com',  role: 'PARTICIPANTE', status: 'TALVEZ' },
      { id: 14, name: 'Ana Pereira',      email: 'ana@siger.com',    role: 'PARTICIPANTE', status: 'SIM'    },
    ],
    topics: [
      { id: 9,  title: 'Apresentação do escopo',   priority: 'ALTA',  timer: 30, orderIndex: 1, concluded: false },
      { id: 10, title: 'Escolha de tecnologias',   priority: 'ALTA',  timer: 30, orderIndex: 2, concluded: false },
      { id: 11, title: 'Distribuição de tarefas',  priority: 'MEDIA', timer: 20, orderIndex: 3, concluded: false },
    ],
  },
  {
    id: 5,
    title: 'Daily Standup',
    description: 'Alinhamento diário da equipe — o que foi feito, o que será feito, impedimentos.',
    location: 'Sala Virtual 1',
    meetingDate: '2026-04-24T09:00:00',
    duration: 15,
    status: 'FINALIZADA',
    user: { id: 2, name: 'João Organizador', email: 'joao@siger.com' },
    participants: [
      { id: 15, name: 'João Organizador', email: 'joao@siger.com',   role: 'ORGANIZADOR',  status: 'SIM' },
      { id: 16, name: 'Maria Silva',      email: 'maria@siger.com',  role: 'PARTICIPANTE', status: 'SIM' },
      { id: 17, name: 'Carlos Souza',     email: 'carlos@siger.com', role: 'PARTICIPANTE', status: 'SIM' },
    ],
    topics: [
      { id: 12, title: 'Updates individuais', priority: 'MEDIA', timer: 10, orderIndex: 1, concluded: true },
      { id: 13, title: 'Impedimentos',        priority: 'ALTA',  timer:  5, orderIndex: 2, concluded: true },
    ],
  },
];

let nextMeetingId = 6;

// ─── Interceptor ─────────────────────────────────────────────────────────────

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.mockApi) return next(req);

  const url    = req.url.replace(environment.apiUrl, '');
  const method = req.method;

  const respond = (body: unknown, status = 200) =>
    of(new HttpResponse({ status, body })).pipe(delay(300));

  // POST /auth/login
  if (method === 'POST' && url === '/auth/login') {
    const { email, password } = req.body as any;
    if (!email || !password) {
      return of(new HttpResponse({ status: 401, body: { message: 'Credenciais inválidas.' } }));
    }
    const isAdmin = email.includes('admin');
    const roles   = isAdmin ? ['ADMIN', 'ROLE_ADMIN'] : ['PARTICIPANTE', 'ROLE_PARTICIPANTE'];
    return respond({ token: buildFakeJwt(email, roles) });
  }

  // POST /auth/forgot-password
  if (method === 'POST' && url === '/auth/forgot-password') {
    return respond({ message: 'E-mail enviado.' });
  }

  // POST /auth/reset-password
  if (method === 'POST' && url === '/auth/reset-password') {
    return respond({ message: 'Senha redefinida.' });
  }

  // GET /api/user/findAll
  if (method === 'GET' && url === '/api/user/findAll') {
    return respond([...mockUsers]);
  }

  // POST /api/user
  if (method === 'POST' && url === '/api/user') {
    const body = req.body as any;
    const novo = { ...body, id: nextUserId++, status: 'ATIVO' };
    mockUsers.push(novo);
    return respond(novo, 201);
  }

  // PUT /api/user/:id
  if (method === 'PUT' && url.startsWith('/api/user/')) {
    const id      = Number(url.split('/').pop());
    const body    = req.body as any;
    const idx     = mockUsers.findIndex(u => u.id === id);
    if (idx !== -1) mockUsers[idx] = { ...mockUsers[idx], ...body, id };
    return respond(mockUsers[idx] ?? body);
  }

  // DELETE /api/user/:id
  if (method === 'DELETE' && url.startsWith('/api/user/')) {
    const id  = Number(url.split('/').pop());
    mockUsers = mockUsers.filter(u => u.id !== id);
    return respond(null, 204);
  }

  // GET /api/meeting/findAll
  if (method === 'GET' && url === '/api/meeting/findAll') {
    return respond([...mockMeetings]);
  }

  // GET /api/meeting/:id
  if (method === 'GET' && url.match(/^\/api\/meeting\/\d+$/)) {
    const id = Number(url.split('/').pop());
    const meeting = mockMeetings.find(m => m.id === id);
    return meeting ? respond(meeting) : respond({ message: 'Não encontrado' }, 404);
  }

  // POST /api/meeting
  if (method === 'POST' && url === '/api/meeting') {
    const body = req.body as any;
    const novo = { ...body, id: nextMeetingId++, status: body.status ?? 'AGENDADA', participants: [], topics: [] };
    mockMeetings.push(novo);
    return respond(novo, 201);
  }

  // PUT /api/meeting/:id
  if (method === 'PUT' && url.match(/^\/api\/meeting\/\d+$/)) {
    const id  = Number(url.split('/').pop());
    const body = req.body as any;
    const idx  = mockMeetings.findIndex(m => m.id === id);
    if (idx !== -1) mockMeetings[idx] = { ...mockMeetings[idx], ...body, id };
    return respond(mockMeetings[idx] ?? body);
  }

  // DELETE /api/meeting/:id
  if (method === 'DELETE' && url.match(/^\/api\/meeting\/\d+$/)) {
    const id = Number(url.split('/').pop());
    mockMeetings = mockMeetings.filter(m => m.id !== id);
    return respond(null, 204);
  }

  return next(req);
};
