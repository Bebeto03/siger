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
  { id: 1, name: 'Admin Sistema',    email: 'admin@siger.com',       cpf: '00000000001', phone: '(11) 99999-0001', type: 'ADMIN',        status: 'ATIVO'   },
  { id: 2, name: 'João Organizador', email: 'joao@siger.com',        cpf: '00000000002', phone: '(11) 99999-0002', type: 'ORGANIZADOR',  status: 'ATIVO'   },
  { id: 3, name: 'Maria Silva',      email: 'maria@siger.com',       cpf: '00000000003', phone: '(11) 99999-0003', type: 'PARTICIPANTE', status: 'ATIVO'   },
  { id: 4, name: 'Carlos Souza',     email: 'carlos@siger.com',      cpf: '00000000004', phone: '(11) 99999-0004', type: 'PARTICIPANTE', status: 'INATIVO' },
  { id: 5, name: 'Ana Pereira',      email: 'ana@siger.com',         cpf: '00000000005', phone: '(11) 99999-0005', type: 'ORGANIZADOR',  status: 'ATIVO'   },
];

let nextId = 6;

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
    const novo = { ...body, id: nextId++, status: 'ATIVO' };
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

  return next(req);
};
