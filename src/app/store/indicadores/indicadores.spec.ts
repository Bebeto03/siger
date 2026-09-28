import { Meeting } from '../../core/models/meeting.model';
import { Task } from '../../core/models/task.model';
import { IndicadoresActions } from './indicadores.actions';
import { indicadoresReducer, initialState, IndicadoresState } from './indicadores.reducer';
import {
  agruparComparecimentoPorMes,
  agruparDuracaoMediaPorMes,
  agruparReunioesPorMes,
  contarConfirmacoesPendentes,
  criarSelectorsMensais,
  distribuirPorStatus,
  MEETING_STATUS_LABEL,
  selectReunioesPorStatus,
  selectTarefasPorStatus,
  selectTaxaConclusao,
  TASK_STATUS_LABEL,
  ultimosMeses,
} from './indicadores.selectors';

// Data de referência fixa: 16/09/2026
const HOJE = new Date(2026, 8, 16);

const reuniao = (over: Partial<Meeting>): Meeting => ({
  id: 1,
  title: 'R',
  description: '',
  location: '',
  meetingDate: '2026-09-10T10:00:00',
  duration: 60,
  status: 'NAO_INICIADO',
  participants: [],
  ...over,
});

const MEETINGS: Meeting[] = [
  // Setembro/26 — concluída, 2 de 3 participaram
  reuniao({
    id: 1, meetingDate: '2026-09-01T09:00:00', duration: 30, status: 'CONCLUIDO',
    participants: [
      { id: 1, role: 'ORGANIZADOR',  participation: 'PARTICIPOU',     user: { id: 1 } },
      { id: 2, role: 'PARTICIPANTE', participation: 'PARTICIPOU',     user: { id: 2 } },
      { id: 3, role: 'PARTICIPANTE', participation: 'NAO_PARTICIPOU', user: { id: 3 } },
    ],
  }),
  // Setembro/26 — agendada com 1 pendente (TALVEZ) e 1 sem resposta
  reuniao({
    id: 2, meetingDate: '2026-09-20T14:00:00', duration: 90, status: 'NAO_INICIADO',
    participants: [
      { id: 4, role: 'PARTICIPANTE', participation: 'TALVEZ', user: { id: 2 } },
      { id: 5, role: 'PARTICIPANTE', participation: 'SIM',    user: { id: 3 } },
      { id: 6, role: 'PARTICIPANTE',                          user: { id: 4 } },
    ],
  }),
  // Setembro/26 — cancelada (não conta em realizadas nem em duração)
  reuniao({ id: 3, meetingDate: '2026-09-05T10:00:00', duration: 500, status: 'CANCELADO' }),
  // Agosto/26 — concluída, ninguém participou
  reuniao({
    id: 4, meetingDate: '2026-08-15T10:00:00', duration: 45, status: 'CONCLUIDO',
    participants: [{ id: 7, role: 'PARTICIPANTE', participation: 'NAO_PARTICIPOU', user: { id: 2 } }],
  }),
  // Fora da janela de 12 meses
  reuniao({ id: 5, meetingDate: '2025-08-01T10:00:00', duration: 999, status: 'CONCLUIDO' }),
];

const TASKS: Task[] = [
  { id: 1, title: 'a', status: 'NAO_INICIADO', meeting: { id: 1 } },
  { id: 2, title: 'b', status: 'NAO_INICIADO', meeting: { id: 1 } },
  { id: 3, title: 'c', status: 'CONCLUIDO',    meeting: { id: 2 } },
];

const estado = (over: Partial<IndicadoresState> = {}) => ({
  indicadores: { ...initialState, meetings: MEETINGS, tasks: TASKS, loaded: true, ...over },
});

describe('indicadoresReducer', () => {
  it('marca loading ao carregar e limpa erro anterior', () => {
    const s = indicadoresReducer({ ...initialState, error: 'x' }, IndicadoresActions.carregar());
    expect(s.loading).toBe(true);
    expect(s.error).toBeNull();
  });

  it('armazena payload no sucesso', () => {
    const s = indicadoresReducer(
      { ...initialState, loading: true },
      IndicadoresActions.carregarSucesso({ meetings: MEETINGS, tasks: TASKS, attendanceGeneral: 66.6, averageTime: 55 }),
    );
    expect(s.loading).toBe(false);
    expect(s.loaded).toBe(true);
    expect(s.meetings).toHaveLength(5);
    expect(s.attendanceGeneral).toBe(66.6);
  });

  it('registra erro na falha sem perder dados já carregados', () => {
    const s = indicadoresReducer(
      { ...initialState, meetings: MEETINGS, loading: true },
      IndicadoresActions.carregarFalha({ error: 'boom' }),
    );
    expect(s.error).toBe('boom');
    expect(s.loading).toBe(false);
    expect(s.meetings).toHaveLength(5);
  });
});

describe('ultimosMeses', () => {
  it('gera janela deslizante terminando no mês de referência, cruzando o ano', () => {
    const meses = ultimosMeses(12, HOJE);
    expect(meses).toHaveLength(12);
    expect(meses[0]).toEqual({ ano: 2025, mes: 9, label: 'Out/25' });
    expect(meses[11]).toEqual({ ano: 2026, mes: 8, label: 'Set/26' });
  });
});

describe('agregações mensais', () => {
  const meses = ultimosMeses(12, HOJE);

  it('reuniões por mês separa realizadas e canceladas e ignora fora da janela', () => {
    const r = agruparReunioesPorMes(MEETINGS, meses);
    expect(r.realizadas[11]).toBe(2); // set/26: ids 1 e 2
    expect(r.canceladas[11]).toBe(1); // set/26: id 3
    expect(r.realizadas[10]).toBe(1); // ago/26: id 4
    expect(r.realizadas.reduce((a, b) => a + b, 0)).toBe(3); // id 5 fora da janela
  });

  it('comparecimento usa só reuniões concluídas e devolve null sem dados', () => {
    const r = agruparComparecimentoPorMes(MEETINGS, meses);
    expect(r.taxa[11]).toBe(66.7); // 2 de 3 na reunião 1; reunião 2 (agendada) ignorada
    expect(r.taxa[10]).toBe(0);    // ago/26: 0 de 1
    expect(r.taxa[0]).toBeNull();  // out/25: sem reunião
  });

  it('duração média ignora canceladas', () => {
    const r = agruparDuracaoMediaPorMes(MEETINGS, meses);
    expect(r.minutos[11]).toBe(60); // (30 + 90) / 2 — a cancelada de 500min fica de fora
    expect(r.minutos[0]).toBeNull();
  });
});

describe('distribuições e contagens', () => {
  it('distribui reuniões por status na ordem fixa do enum', () => {
    const d = distribuirPorStatus(MEETINGS, MEETING_STATUS_LABEL);
    expect(d.keys).toEqual(['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']);
    expect(d.values).toEqual([1, 0, 3, 1]);
    expect(d.total).toBe(5);
  });

  it('distribui tarefas por status', () => {
    const d = distribuirPorStatus(TASKS, TASK_STATUS_LABEL);
    expect(d.values).toEqual([2, 0, 1]);
  });

  it('conta confirmações pendentes (TALVEZ ou sem resposta) por reunião', () => {
    const c = contarConfirmacoesPendentes(MEETINGS);
    expect(c).toEqual({ 2: 2 });
  });
});

describe('selectors sobre o estado', () => {
  it('selectReunioesPorStatus / selectTarefasPorStatus leem o feature state', () => {
    expect(selectReunioesPorStatus(estado()).values).toEqual([1, 0, 3, 1]);
    expect(selectTarefasPorStatus(estado()).values).toEqual([2, 0, 1]);
  });

  it('taxa de conclusão exclui canceladas do denominador', () => {
    expect(selectTaxaConclusao(estado())).toBe(75); // 3 concluídas de 4 não canceladas
    expect(selectTaxaConclusao(estado({ meetings: [] }))).toBeNull();
  });

  it('fábrica de selectors mensais respeita a data de referência', () => {
    const { selectReunioesEsteMes, selectReunioesPorMes } = criarSelectorsMensais(HOJE);
    expect(selectReunioesEsteMes(estado())).toBe(3); // set/26 inclui a cancelada
    expect(selectReunioesPorMes(estado()).labels[11]).toBe('Set/26');
  });
});
