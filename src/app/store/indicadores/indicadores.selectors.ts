import { createSelector } from '@ngrx/store';
import { Meeting, MeetingStatus } from '../../core/models/meeting.model';
import { TaskStatus } from '../../core/models/task.model';
import { selectMeetings, selectTasks } from './indicadores.reducer';

export const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  NAO_INICIADO: 'Agendadas',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO:    'Concluídas',
  CANCELADO:    'Canceladas',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  NAO_INICIADO: 'Pendentes',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO:    'Concluídas',
};

export interface MesReferencia {
  ano: number;
  mes: number;   // 0–11
  label: string; // "Set/25"
}

export interface SerieMensal {
  labels: string[];
  meses: MesReferencia[];
}

export interface ReunioesPorMes extends SerieMensal {
  realizadas: number[];   // todas exceto canceladas
  canceladas: number[];
}

export interface ComparecimentoPorMes extends SerieMensal {
  taxa: (number | null)[]; // % — null quando não há reunião concluída com participantes no mês
}

export interface DuracaoMediaPorMes extends SerieMensal {
  minutos: (number | null)[];
}

export interface Distribuicao<K extends string> {
  labels: string[];
  keys: K[];
  values: number[];
  total: number;
}

// ─── Helpers puros ───────────────────────────────────────────────────────────

/** Janela deslizante dos últimos `qtd` meses terminando em `referencia`. */
export function ultimosMeses(qtd: number, referencia: Date): MesReferencia[] {
  return Array.from({ length: qtd }, (_, i) => {
    const d = new Date(referencia.getFullYear(), referencia.getMonth() - (qtd - 1) + i, 1);
    return {
      ano:   d.getFullYear(),
      mes:   d.getMonth(),
      label: `${MESES_ABREV[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`,
    };
  });
}

function mesmoMes(dateStr: string | undefined, ref: MesReferencia): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === ref.ano && d.getMonth() === ref.mes;
}

export function agruparReunioesPorMes(meetings: Meeting[], meses: MesReferencia[]): ReunioesPorMes {
  const realizadas = meses.map(ref =>
    meetings.filter(m => m.status !== 'CANCELADO' && mesmoMes(m.meetingDate, ref)).length);
  const canceladas = meses.map(ref =>
    meetings.filter(m => m.status === 'CANCELADO' && mesmoMes(m.meetingDate, ref)).length);
  return { meses, labels: meses.map(m => m.label), realizadas, canceladas };
}

/**
 * Taxa de comparecimento (% de participantes com PARTICIPOU) por mês.
 * Considera apenas reuniões CONCLUIDO: antes disso ninguém pode ter participado,
 * e incluir reuniões futuras puxaria a taxa artificialmente para 0.
 */
export function agruparComparecimentoPorMes(meetings: Meeting[], meses: MesReferencia[]): ComparecimentoPorMes {
  const taxa = meses.map(ref => {
    let presentes = 0, total = 0;
    for (const m of meetings) {
      if (m.status !== 'CONCLUIDO' || !mesmoMes(m.meetingDate, ref)) continue;
      for (const p of m.participants ?? []) {
        total++;
        if (p.participation === 'PARTICIPOU') presentes++;
      }
    }
    return total === 0 ? null : Math.round((presentes / total) * 1000) / 10;
  });
  return { meses, labels: meses.map(m => m.label), taxa };
}

export function agruparDuracaoMediaPorMes(meetings: Meeting[], meses: MesReferencia[]): DuracaoMediaPorMes {
  const minutos = meses.map(ref => {
    const doMes = meetings.filter(m => m.status !== 'CANCELADO' && m.duration && mesmoMes(m.meetingDate, ref));
    if (!doMes.length) return null;
    return Math.round(doMes.reduce((s, m) => s + m.duration, 0) / doMes.length);
  });
  return { meses, labels: meses.map(m => m.label), minutos };
}

export function distribuirPorStatus<K extends string>(
  items: { status?: K }[],
  labels: Record<K, string>,
): Distribuicao<K> {
  const keys = Object.keys(labels) as K[];
  const values = keys.map(k => items.filter(i => i.status === k).length);
  return { keys, labels: keys.map(k => labels[k]), values, total: items.length };
}

/** Participantes ainda sem resposta (TALVEZ ou sem valor) por reunião. */
export function contarConfirmacoesPendentes(meetings: Meeting[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const m of meetings) {
    if (m.id == null) continue;
    const pendentes = (m.participants ?? []).filter(p => !p.participation || p.participation === 'TALVEZ').length;
    if (pendentes > 0) out[m.id] = pendentes;
  }
  return out;
}

// ─── Selectors ───────────────────────────────────────────────────────────────

/**
 * Fábrica para permitir data de referência fixa nos testes.
 * A instância padrão (abaixo) usa a data em que o módulo foi carregado.
 */
export function criarSelectorsMensais(referencia: Date, qtdMeses = 12) {
  const meses = ultimosMeses(qtdMeses, referencia);

  const selectReunioesPorMes = createSelector(selectMeetings, m => agruparReunioesPorMes(m, meses));
  const selectComparecimentoPorMes = createSelector(selectMeetings, m => agruparComparecimentoPorMes(m, meses));
  const selectDuracaoMediaPorMes = createSelector(selectMeetings, m => agruparDuracaoMediaPorMes(m, meses));

  const selectReunioesEsteMes = createSelector(selectMeetings, m => {
    const atual = meses[meses.length - 1];
    return m.filter(x => mesmoMes(x.meetingDate, atual)).length;
  });

  return { meses, selectReunioesPorMes, selectComparecimentoPorMes, selectDuracaoMediaPorMes, selectReunioesEsteMes };
}

export const {
  selectReunioesPorMes,
  selectComparecimentoPorMes,
  selectDuracaoMediaPorMes,
  selectReunioesEsteMes,
} = criarSelectorsMensais(new Date());

export const selectReunioesPorStatus = createSelector(selectMeetings, m =>
  distribuirPorStatus(m, MEETING_STATUS_LABEL));

export const selectTarefasPorStatus = createSelector(selectTasks, t =>
  distribuirPorStatus(t, TASK_STATUS_LABEL));

export const selectTotalReunioes = createSelector(selectMeetings, m => m.length);

export const selectTaxaConclusao = createSelector(selectMeetings, m => {
  const validas = m.filter(x => x.status !== 'CANCELADO');
  if (!validas.length) return null;
  return (validas.filter(x => x.status === 'CONCLUIDO').length / validas.length) * 100;
});

/** Duração média calculada localmente (fallback quando o backend não responde). */
export const selectDuracaoMediaLocal = createSelector(selectMeetings, m => {
  const comDuracao = m.filter(x => x.duration && x.status !== 'CANCELADO');
  if (!comDuracao.length) return null;
  return Math.round(comDuracao.reduce((s, x) => s + x.duration, 0) / comDuracao.length);
});

export const selectTarefasPendentes = createSelector(selectTasks, t =>
  t.filter(x => x.status === 'NAO_INICIADO').length);

export const selectProximasReunioes = createSelector(selectMeetings, m =>
  [...m]
    .filter(x => x.status === 'NAO_INICIADO' || x.status === 'EM_ANDAMENTO')
    .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime())
    .slice(0, 4));

export const selectTarefasRecentes = createSelector(selectTasks, t =>
  t.filter(x => x.status !== 'CONCLUIDO').slice(0, 3));

export const selectParticipantesPorReuniao = createSelector(selectMeetings, m => {
  const out: Record<number, number> = {};
  for (const x of m) if (x.id != null) out[x.id] = x.participants?.length ?? 0;
  return out;
});

export const selectConfirmacoesPendentesPorReuniao = createSelector(selectMeetings, contarConfirmacoesPendentes);

export const selectReunioesComConfirmacaoPendente = createSelector(
  selectMeetings,
  selectConfirmacoesPendentesPorReuniao,
  (m, pendentes) =>
    m
      .filter(x => x.status === 'NAO_INICIADO' && x.id != null && (pendentes[x.id] ?? 0) > 0)
      .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime())
      .slice(0, 3),
);
