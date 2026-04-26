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

let mockUsers: any[] = [
  { id: 1, name: 'Admin Sistema',    email: 'admin@siger.com',  cpf: '00000000001', phone: '(11) 99999-0001', type: 'ADMIN',        status: 'ATIVO' },
  { id: 2, name: 'João Organizador', email: 'joao@siger.com',   cpf: '00000000002', phone: '(11) 99999-0002', type: 'ORGANIZADOR',  status: 'ATIVO' },
  { id: 3, name: 'Maria Silva',      email: 'maria@siger.com',  cpf: '00000000003', phone: '(11) 99999-0003', type: 'PARTICIPANTE', status: 'ATIVO' },
  { id: 4, name: 'Carlos Souza',     email: 'carlos@siger.com', cpf: '00000000004', phone: '(11) 99999-0004', type: 'PARTICIPANTE', status: 'INATIVO' },
  { id: 5, name: 'Ana Pereira',      email: 'ana@siger.com',    cpf: '00000000005', phone: '(11) 99999-0005', type: 'ORGANIZADOR',  status: 'ATIVO' },
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
    status: 'NAO_INICIADO',
    organizer: { id: 2, name: 'João Organizador', email: 'joao@siger.com' },
  },
  {
    id: 2,
    title: 'Review de Ata — Projeto X',
    description: 'Revisão da ata e pautas pendentes do projeto X. Alinhamento entre equipes.',
    location: 'Sala 3B',
    meetingDate: '2026-04-28T14:00:00',
    duration: 45,
    status: 'NAO_INICIADO',
    organizer: { id: 5, name: 'Ana Pereira', email: 'ana@siger.com' },
  },
  {
    id: 3,
    title: 'Retrospectiva S3',
    description: 'Pontos positivos e melhorias identificados no sprint 3. O que manter, parar e iniciar.',
    location: 'Sala Virtual 2',
    meetingDate: '2026-04-25T16:00:00',
    duration: 60,
    status: 'CONCLUIDO',
    organizer: { id: 2, name: 'João Organizador', email: 'joao@siger.com' },
  },
  {
    id: 4,
    title: 'Kickoff — Módulo de IA',
    description: 'Início do desenvolvimento do módulo de resumo via IA. Definição de escopo, tecnologias e responsáveis.',
    location: 'Auditório',
    meetingDate: '2026-04-30T10:00:00',
    duration: 90,
    status: 'NAO_INICIADO',
    organizer: { id: 2, name: 'João Organizador', email: 'joao@siger.com' },
  },
  {
    id: 5,
    title: 'Daily Standup',
    description: 'Alinhamento diário da equipe — o que foi feito, o que será feito, impedimentos.',
    location: 'Sala Virtual 1',
    meetingDate: '2026-04-24T09:00:00',
    duration: 15,
    status: 'CONCLUIDO',
    organizer: { id: 2, name: 'João Organizador', email: 'joao@siger.com' },
  },
];
let nextMeetingId = 6;

// ─── Fake Participants ───────────────────────────────────────────────────────

let mockParticipants: any[] = [
  { id: 1,  role: 'ORGANIZADOR',  participation: 'SIM',    user: { id: 2, name: 'João Organizador', email: 'joao@siger.com'   }, meeting: { id: 1 } },
  { id: 2,  role: 'PARTICIPANTE', participation: 'SIM',    user: { id: 3, name: 'Maria Silva',      email: 'maria@siger.com'  }, meeting: { id: 1 } },
  { id: 3,  role: 'PARTICIPANTE', participation: 'TALVEZ', user: { id: 4, name: 'Carlos Souza',     email: 'carlos@siger.com' }, meeting: { id: 1 } },
  { id: 4,  role: 'PARTICIPANTE', participation: 'SIM',    user: { id: 5, name: 'Ana Pereira',      email: 'ana@siger.com'    }, meeting: { id: 1 } },

  { id: 5,  role: 'ORGANIZADOR',  participation: 'SIM',    user: { id: 5, name: 'Ana Pereira',      email: 'ana@siger.com'    }, meeting: { id: 2 } },
  { id: 6,  role: 'PARTICIPANTE', participation: 'SIM',    user: { id: 3, name: 'Maria Silva',      email: 'maria@siger.com'  }, meeting: { id: 2 } },
  { id: 7,  role: 'PARTICIPANTE', participation: 'SIM',    user: { id: 2, name: 'João Organizador', email: 'joao@siger.com'   }, meeting: { id: 2 } },

  { id: 8,  role: 'ORGANIZADOR',  participation: 'PARTICIPOU', user: { id: 2, name: 'João Organizador', email: 'joao@siger.com'   }, meeting: { id: 3 } },
  { id: 9,  role: 'PARTICIPANTE', participation: 'PARTICIPOU', user: { id: 3, name: 'Maria Silva',      email: 'maria@siger.com'  }, meeting: { id: 3 } },
  { id: 10, role: 'PARTICIPANTE', participation: 'PARTICIPOU', user: { id: 4, name: 'Carlos Souza',     email: 'carlos@siger.com' }, meeting: { id: 3 } },
  { id: 11, role: 'PARTICIPANTE', participation: 'NAO_PARTICIPOU', user: { id: 5, name: 'Ana Pereira', email: 'ana@siger.com'    }, meeting: { id: 3 } },

  { id: 12, role: 'ORGANIZADOR',  participation: 'SIM',    user: { id: 2, name: 'João Organizador', email: 'joao@siger.com'   }, meeting: { id: 4 } },
  { id: 13, role: 'PARTICIPANTE', participation: 'TALVEZ', user: { id: 3, name: 'Maria Silva',      email: 'maria@siger.com'  }, meeting: { id: 4 } },
  { id: 14, role: 'PARTICIPANTE', participation: 'SIM',    user: { id: 5, name: 'Ana Pereira',      email: 'ana@siger.com'    }, meeting: { id: 4 } },

  { id: 15, role: 'ORGANIZADOR',  participation: 'PARTICIPOU', user: { id: 2, name: 'João Organizador', email: 'joao@siger.com'   }, meeting: { id: 5 } },
  { id: 16, role: 'PARTICIPANTE', participation: 'PARTICIPOU', user: { id: 3, name: 'Maria Silva',      email: 'maria@siger.com'  }, meeting: { id: 5 } },
  { id: 17, role: 'PARTICIPANTE', participation: 'PARTICIPOU', user: { id: 4, name: 'Carlos Souza',     email: 'carlos@siger.com' }, meeting: { id: 5 } },
];
let nextParticipantId = 18;

// ─── Fake Meeting Minutes ────────────────────────────────────────────────────

let mockMinutes: any[] = [
  { id: 1, objectives: 'Definir escopo do sprint 4', notes: 'Revisão do backlog concluída. Metas definidas.', decision: 'Sprint focado em módulo de relatórios.', meeting: { id: 1 } },
  { id: 2, objectives: 'Revisar pendências do Projeto X', notes: 'Pendências listadas e discutidas com as equipes.', decision: 'Prazo estendido em 2 semanas.', meeting: { id: 2 } },
  { id: 3, objectives: 'Retrospectiva do sprint 3', notes: 'Boa comunicação entre equipes. Melhorar code review.', decision: 'Adotar pair programming nas próximas sprints.', meeting: { id: 3 } },
  { id: 4, objectives: 'Kickoff do módulo de IA', notes: '', decision: '', meeting: { id: 4 } },
  { id: 5, objectives: 'Daily standup', notes: 'Sem impedimentos.', decision: '', meeting: { id: 5 } },
];
let nextMinutesId = 6;

// ─── Fake Topics ─────────────────────────────────────────────────────────────

let mockTopics: any[] = [
  { id: 1,  title: 'Revisão do backlog',           priority: 'ALTA',  timer: 15, orderIndex: 1, concluded: false, responsible: { id: 2 }, meetingMinutes: { id: 1 } },
  { id: 2,  title: 'Definição de metas do sprint', priority: 'ALTA',  timer: 20, orderIndex: 2, concluded: false, responsible: { id: 2 }, meetingMinutes: { id: 1 } },
  { id: 3,  title: 'Distribuição de tarefas',      priority: 'MEDIA', timer: 15, orderIndex: 3, concluded: false, responsible: { id: 2 }, meetingMinutes: { id: 1 } },

  { id: 4,  title: 'Revisão de pendências',        priority: 'ALTA',  timer: 20, orderIndex: 1, concluded: false, responsible: { id: 5 }, meetingMinutes: { id: 2 } },
  { id: 5,  title: 'Próximos passos',              priority: 'MEDIA', timer: 15, orderIndex: 2, concluded: false, responsible: { id: 5 }, meetingMinutes: { id: 2 } },

  { id: 6,  title: 'O que funcionou bem',          priority: 'MEDIA', timer: 15, orderIndex: 1, concluded: true,  responsible: { id: 2 }, meetingMinutes: { id: 3 } },
  { id: 7,  title: 'O que pode melhorar',          priority: 'ALTA',  timer: 20, orderIndex: 2, concluded: true,  responsible: { id: 2 }, meetingMinutes: { id: 3 } },
  { id: 8,  title: 'Ações para o próximo sprint',  priority: 'ALTA',  timer: 15, orderIndex: 3, concluded: true,  responsible: { id: 2 }, meetingMinutes: { id: 3 } },

  { id: 9,  title: 'Apresentação do escopo',       priority: 'ALTA',  timer: 30, orderIndex: 1, concluded: false, responsible: { id: 2 }, meetingMinutes: { id: 4 } },
  { id: 10, title: 'Escolha de tecnologias',       priority: 'ALTA',  timer: 30, orderIndex: 2, concluded: false, responsible: { id: 2 }, meetingMinutes: { id: 4 } },
  { id: 11, title: 'Distribuição de tarefas',      priority: 'MEDIA', timer: 20, orderIndex: 3, concluded: false, responsible: { id: 2 }, meetingMinutes: { id: 4 } },

  { id: 12, title: 'Updates individuais',          priority: 'MEDIA', timer: 10, orderIndex: 1, concluded: true,  responsible: { id: 2 }, meetingMinutes: { id: 5 } },
  { id: 13, title: 'Impedimentos',                 priority: 'ALTA',  timer:  5, orderIndex: 2, concluded: true,  responsible: { id: 2 }, meetingMinutes: { id: 5 } },
];
let nextTopicId = 14;

// ─── Fake Tasks ──────────────────────────────────────────────────────────────

let mockTasks: any[] = [
  { id: 1,  title: 'Atualizar doc de requisitos',   status: 'PENDENTE',     dueDate: '2026-04-30', assignee: { id: 3, name: 'Maria Silva',      email: 'maria@siger.com'  }, meeting: { id: 1, title: 'Sprint Planning S4'    } },
  { id: 2,  title: 'Configurar ambiente Docker',     status: 'EM_ANDAMENTO', dueDate: '2026-04-29', assignee: { id: 4, name: 'Carlos Souza',     email: 'carlos@siger.com' }, meeting: { id: 1, title: 'Sprint Planning S4'    } },
  { id: 3,  title: 'Implementar exportação PDF',     status: 'PENDENTE',     dueDate: '2026-05-02', assignee: { id: 2, name: 'João Organizador', email: 'joao@siger.com'   }, meeting: { id: 1, title: 'Sprint Planning S4'    } },
  { id: 4,  title: 'Revisar pendências Projeto X',   status: 'EM_ANDAMENTO', dueDate: '2026-04-28', assignee: { id: 5, name: 'Ana Pereira',      email: 'ana@siger.com'    }, meeting: { id: 2, title: 'Review de Ata — Projeto X' } },
  { id: 5,  title: 'Levantar próximos passos',       status: 'PENDENTE',     dueDate: '2026-04-29', assignee: { id: 3, name: 'Maria Silva',      email: 'maria@siger.com'  }, meeting: { id: 2, title: 'Review de Ata — Projeto X' } },
  { id: 6,  title: 'Setup inicial do projeto IA',    status: 'PENDENTE',     dueDate: '2026-05-05', assignee: { id: 2, name: 'João Organizador', email: 'joao@siger.com'   }, meeting: { id: 4, title: 'Kickoff — Módulo de IA'   } },
  { id: 7,  title: 'Escolher stack de ML',           status: 'PENDENTE',     dueDate: '2026-05-06', assignee: { id: 5, name: 'Ana Pereira',      email: 'ana@siger.com'    }, meeting: { id: 4, title: 'Kickoff — Módulo de IA'   } },
  { id: 8,  title: 'Documentar retrospectiva S3',    status: 'CONCLUIDA',    dueDate: '2026-04-26', assignee: { id: 2, name: 'João Organizador', email: 'joao@siger.com'   }, meeting: { id: 3, title: 'Retrospectiva S3'          } },
  { id: 9,  title: 'Aplicar melhorias identificadas',status: 'CONCLUIDA',    dueDate: '2026-04-26', assignee: { id: 3, name: 'Maria Silva',      email: 'maria@siger.com'  }, meeting: { id: 3, title: 'Retrospectiva S3'          } },
];
let nextTaskId = 10;

// ─── Interceptor ─────────────────────────────────────────────────────────────

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.mockApi) return next(req);

  const url    = req.url.replace(environment.apiUrl, '');
  const method = req.method;

  const respond = (body: unknown, status = 200) =>
    of(new HttpResponse({ status, body })).pipe(delay(300));

  // ── Auth ────────────────────────────────────────────────────────────────────

  if (method === 'POST' && url === '/auth/login') {
    const { email, password } = req.body as any;
    if (!email || !password)
      return of(new HttpResponse({ status: 401, body: { message: 'Credenciais inválidas.' } }));
    const isAdmin = email.includes('admin');
    const roles   = isAdmin
      ? ['ROLE_ADMIN', 'ROLE_ORGANIZADOR']
      : ['ROLE_ORGANIZADOR'];
    return respond({ token: buildFakeJwt(email, roles) });
  }

  if (method === 'POST' && url === '/auth/forgot-password')
    return respond({ message: 'E-mail enviado.' });

  if (method === 'POST' && url === '/auth/reset-password')
    return respond({ message: 'Senha redefinida.' });

  // ── Users ───────────────────────────────────────────────────────────────────

  if (method === 'GET' && url === '/api/user/findAll')
    return respond([...mockUsers]);

  if (method === 'GET' && url.match(/^\/api\/user\/\d+$/)) {
    const id   = Number(url.split('/').pop());
    const user = mockUsers.find(u => u.id === id);
    return user ? respond(user) : respond({ message: 'Não encontrado' }, 404);
  }

  if (method === 'POST' && url === '/api/user') {
    const body = req.body as any;
    const novo = { ...body, id: nextUserId++, status: 'ATIVO' };
    mockUsers.push(novo);
    return respond(novo, 201);
  }

  if (method === 'PUT' && url.match(/^\/api\/user\/\d+$/)) {
    const id  = Number(url.split('/').pop());
    const idx = mockUsers.findIndex(u => u.id === id);
    if (idx !== -1) mockUsers[idx] = { ...mockUsers[idx], ...(req.body as any), id };
    return respond(mockUsers[idx] ?? req.body);
  }

  if (method === 'DELETE' && url.match(/^\/api\/user\/\d+$/)) {
    const id = Number(url.split('/').pop());
    mockUsers = mockUsers.filter(u => u.id !== id);
    return respond(null, 204);
  }

  // ── Meetings ────────────────────────────────────────────────────────────────

  if (method === 'GET' && url === '/api/meeting/findAll')
    return respond([...mockMeetings]);

  if (method === 'GET' && url.match(/^\/api\/meeting\/\d+$/)) {
    const id      = Number(url.split('/').pop());
    const meeting = mockMeetings.find(m => m.id === id);
    return meeting ? respond(meeting) : respond({ message: 'Não encontrado' }, 404);
  }

  if (method === 'POST' && url === '/api/meeting') {
    const body = req.body as any;
    const novo = { ...body, id: nextMeetingId++, status: body.status ?? 'NAO_INICIADO' };
    mockMeetings.push(novo);
    return respond(novo, 201);
  }

  if (method === 'PUT' && url.match(/^\/api\/meeting\/\d+$/)) {
    const id  = Number(url.split('/').pop());
    const idx = mockMeetings.findIndex(m => m.id === id);
    if (idx !== -1) mockMeetings[idx] = { ...mockMeetings[idx], ...(req.body as any), id };
    return respond(mockMeetings[idx] ?? req.body);
  }

  if (method === 'DELETE' && url.match(/^\/api\/meeting\/\d+$/)) {
    const id = Number(url.split('/').pop());
    mockMeetings = mockMeetings.filter(m => m.id !== id);
    return respond(null, 204);
  }

  // ── Participants ─────────────────────────────────────────────────────────────

  if (method === 'GET' && url === '/api/participant/findAll')
    return respond([...mockParticipants]);

  if (method === 'GET' && url.match(/^\/api\/participant\/\d+$/)) {
    const id = Number(url.split('/').pop());
    const p  = mockParticipants.find(x => x.id === id);
    return p ? respond(p) : respond({ message: 'Não encontrado' }, 404);
  }

  if (method === 'POST' && url === '/api/participant') {
    const body = req.body as any;
    const novo = { ...body, id: nextParticipantId++ };
    mockParticipants.push(novo);
    return respond(novo, 201);
  }

  if (method === 'PUT' && url.match(/^\/api\/participant\/\d+$/)) {
    const id  = Number(url.split('/').pop());
    const idx = mockParticipants.findIndex(x => x.id === id);
    if (idx !== -1) mockParticipants[idx] = { ...mockParticipants[idx], ...(req.body as any), id };
    return respond(mockParticipants[idx] ?? req.body);
  }

  if (method === 'DELETE' && url.match(/^\/api\/participant\/\d+$/)) {
    const id = Number(url.split('/').pop());
    mockParticipants = mockParticipants.filter(x => x.id !== id);
    return respond(null, 204);
  }

  // ── Meeting Minutes ──────────────────────────────────────────────────────────

  if (method === 'GET' && url === '/api/meeting/minutes/findAll')
    return respond([...mockMinutes]);

  if (method === 'GET' && url.match(/^\/api\/meeting\/minutes\/\d+$/)) {
    const id  = Number(url.split('/').pop());
    const min = mockMinutes.find(x => x.id === id);
    return min ? respond(min) : respond({ message: 'Não encontrado' }, 404);
  }

  if (method === 'POST' && url === '/api/meeting/minutes') {
    const body = req.body as any;
    const novo = { ...body, id: nextMinutesId++ };
    mockMinutes.push(novo);
    return respond(novo, 201);
  }

  if (method === 'PUT' && url.match(/^\/api\/meeting\/minutes\/\d+$/)) {
    const id  = Number(url.split('/').pop());
    const idx = mockMinutes.findIndex(x => x.id === id);
    if (idx !== -1) mockMinutes[idx] = { ...mockMinutes[idx], ...(req.body as any), id };
    return respond(mockMinutes[idx] ?? req.body);
  }

  if (method === 'DELETE' && url.match(/^\/api\/meeting\/minutes\/\d+$/)) {
    const id = Number(url.split('/').pop());
    mockMinutes = mockMinutes.filter(x => x.id !== id);
    return respond(null, 204);
  }

  // ── Topics ───────────────────────────────────────────────────────────────────

  if (method === 'GET' && url === '/api/topic/findAll')
    return respond([...mockTopics]);

  if (method === 'GET' && url.match(/^\/api\/topic\/\d+$/)) {
    const id = Number(url.split('/').pop());
    const t  = mockTopics.find(x => x.id === id);
    return t ? respond(t) : respond({ message: 'Não encontrado' }, 404);
  }

  if (method === 'POST' && url === '/api/topic') {
    const body = req.body as any;
    const novo = { ...body, id: nextTopicId++ };
    mockTopics.push(novo);
    return respond(novo, 201);
  }

  if (method === 'PUT' && url.match(/^\/api\/topic\/\d+$/)) {
    const id  = Number(url.split('/').pop());
    const idx = mockTopics.findIndex(x => x.id === id);
    if (idx !== -1) mockTopics[idx] = { ...mockTopics[idx], ...(req.body as any), id };
    return respond(mockTopics[idx] ?? req.body);
  }

  if (method === 'DELETE' && url.match(/^\/api\/topic\/\d+$/)) {
    const id = Number(url.split('/').pop());
    mockTopics = mockTopics.filter(x => x.id !== id);
    return respond(null, 204);
  }

  // ── Tasks ────────────────────────────────────────────────────────────────────

  if (method === 'GET' && url === '/api/task/findAll')
    return respond([...mockTasks]);

  if (method === 'GET' && url.match(/^\/api\/task\/\d+$/)) {
    const id = Number(url.split('/').pop());
    const t  = mockTasks.find(x => x.id === id);
    return t ? respond(t) : respond({ message: 'Não encontrado' }, 404);
  }

  if (method === 'POST' && url === '/api/task') {
    const body = req.body as any;
    const novo = { ...body, id: nextTaskId++, createdAt: new Date().toISOString() };
    mockTasks.push(novo);
    return respond(novo, 201);
  }

  if (method === 'PUT' && url.match(/^\/api\/task\/\d+$/)) {
    const id  = Number(url.split('/').pop());
    const idx = mockTasks.findIndex(x => x.id === id);
    if (idx !== -1) mockTasks[idx] = { ...mockTasks[idx], ...(req.body as any), id };
    return respond(mockTasks[idx] ?? req.body);
  }

  if (method === 'DELETE' && url.match(/^\/api\/task\/\d+$/)) {
    const id = Number(url.split('/').pop());
    mockTasks = mockTasks.filter(x => x.id !== id);
    return respond(null, 204);
  }

  // ── Logs ─────────────────────────────────────────────────────────────────────

  if (method === 'POST' && url === '/api/log')
    return respond(null, 201);

  return next(req);
};
