import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Notificacao } from '../models/notificacao.model';
import { NotificacaoService } from './notificacao.service';
import { tempoRelativo } from '../../layout/notification-bell';

const notificacao = (over: Partial<Notificacao>): Notificacao => ({
  id: 1,
  meetingId: 10,
  type: 'MEETING_REMINDER',
  title: 'Reunião em 1 hora',
  message: 'msg',
  read: false,
  createdAt: '2026-09-20T10:00:00',
  ...over,
});

describe('NotificacaoService', () => {
  let service: NotificacaoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(NotificacaoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Responde o par lista + contagem disparado por atualizar(). */
  async function atualizarCom(lista: Notificacao[], naoLidas: number): Promise<void> {
    const promessa = service.atualizar();
    http.expectOne(r => r.method === 'GET' && r.url.endsWith('/notification')).flush(lista);
    http.expectOne(r => r.url.endsWith('/notification/unread-count')).flush({ count: naoLidas });
    await promessa;
  }

  it('atualizar() carrega lista e contagem de não lidas', async () => {
    await atualizarCom([notificacao({ id: 1 }), notificacao({ id: 2, read: true })], 1);

    expect(service.lista().length).toBe(2);
    expect(service.naoLidas()).toBe(1);
  });

  it('atualizar() mantém o estado anterior quando a API falha', async () => {
    await atualizarCom([notificacao({ id: 1 })], 1);

    const promessa = service.atualizar();
    http.expectOne(r => r.method === 'GET' && r.url.endsWith('/notification')).error(new ProgressEvent('error'));
    http.expectOne(r => r.url.endsWith('/notification/unread-count')).error(new ProgressEvent('error'));
    await promessa;

    expect(service.lista().length).toBe(1);
    expect(service.naoLidas()).toBe(1);
  });

  it('marcarComoLida() atualiza a lista e a contagem antes da resposta do servidor', async () => {
    const alvo = notificacao({ id: 1 });
    await atualizarCom([alvo, notificacao({ id: 2 })], 2);

    const promessa = service.marcarComoLida(alvo);

    expect(service.naoLidas()).toBe(1);
    expect(service.lista().find(n => n.id === 1)?.read).toBe(true);

    const req = http.expectOne(r => r.method === 'PATCH' && r.url.endsWith('/notification/1/read'));
    req.flush({ ...alvo, read: true });
    await promessa;
  });

  it('marcarComoLida() ignora notificação que já estava lida', async () => {
    await service.marcarComoLida(notificacao({ read: true }));

    http.expectNone(r => r.method === 'PATCH');
  });

  it('marcarComoLida() recarrega do servidor se a chamada falhar', async () => {
    const alvo = notificacao({ id: 1 });
    await atualizarCom([alvo], 1);

    const promessa = service.marcarComoLida(alvo);
    http.expectOne(r => r.method === 'PATCH').error(new ProgressEvent('error'));
    await Promise.resolve();
    await Promise.resolve();

    http.expectOne(r => r.method === 'GET' && r.url.endsWith('/notification')).flush([alvo]);
    http.expectOne(r => r.url.endsWith('/notification/unread-count')).flush({ count: 1 });
    await promessa;

    expect(service.naoLidas()).toBe(1);
    expect(service.lista()[0].read).toBe(false);
  });

  it('marcarTodasComoLidas() zera a contagem e marca todas na lista', async () => {
    await atualizarCom([notificacao({ id: 1 }), notificacao({ id: 2 })], 2);

    const promessa = service.marcarTodasComoLidas();

    expect(service.naoLidas()).toBe(0);
    expect(service.lista().every(n => n.read)).toBe(true);

    http.expectOne(r => r.method === 'PATCH' && r.url.endsWith('/notification/read-all')).flush(null);
    await promessa;
  });

  it('marcarTodasComoLidas() não chama a API quando não há não lidas', async () => {
    await service.marcarTodasComoLidas();

    http.expectNone(r => r.method === 'PATCH');
  });
});

describe('tempoRelativo', () => {
  const agora = new Date('2026-09-20T12:00:00');

  it('formata minutos, horas e dias', () => {
    expect(tempoRelativo('2026-09-20T11:59:40', agora)).toBe('agora');
    expect(tempoRelativo('2026-09-20T11:55:00', agora)).toBe('há 5 min');
    expect(tempoRelativo('2026-09-20T09:00:00', agora)).toBe('há 3 h');
    expect(tempoRelativo('2026-09-18T12:00:00', agora)).toBe('há 2 d');
  });
});
