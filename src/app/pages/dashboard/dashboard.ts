import { Component, inject, OnInit, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ChartData, ChartOptions } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { ChartComponent } from '../../shared/components/chart/chart';
import { CHART_SERIES, withAlpha } from '../../shared/components/chart/chart-theme';
import {
  IndicadoresActions,
  selectAttendanceGeneral,
  selectAverageTime,
  selectConfirmacoesPendentesPorReuniao,
  selectDuracaoMediaLocal,
  selectDuracaoMediaPorMes,
  selectLoaded,
  selectLoading,
  selectParticipantesPorReuniao,
  selectProximasReunioes,
  selectReunioesComConfirmacaoPendente,
  selectReunioesEsteMes,
  selectReunioesPorMes,
  selectTarefasPendentes,
  selectTarefasRecentes,
} from '../../store/indicadores';

/** Variação percentual entre o mês atual e o anterior; null quando não dá para comparar. */
function variacaoPct(atual: number | null, anterior: number | null): number | null {
  if (atual == null || anterior == null || anterior === 0) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, ChartComponent],
  styles: [`
    .stat-card { transition: border-color 0.15s, box-shadow 0.15s; }
    .meeting-card { transition: border-color 0.15s, box-shadow 0.15s; cursor: pointer; }
    .meeting-card:hover { border-color: var(--color-primary) !important; box-shadow: 0 0 0 1px rgba(6,182,212,0.15); }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.8s linear infinite; }
  `],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
  readonly router = inject(Router);
  private store   = inject(Store);
  private auth    = inject(AuthService);

  // ─── Estado vindo do store (NgRx) ─────────────────────────────────────────
  loading = this.store.selectSignal(selectLoading);
  loaded  = this.store.selectSignal(selectLoaded);

  meetingsThisMonth        = this.store.selectSignal(selectReunioesEsteMes);
  attendanceRate           = this.store.selectSignal(selectAttendanceGeneral);
  pendingTasks             = this.store.selectSignal(selectTarefasPendentes);
  upcomingMeetings         = this.store.selectSignal(selectProximasReunioes);
  recentTasks              = this.store.selectSignal(selectTarefasRecentes);
  participantCount         = this.store.selectSignal(selectParticipantesPorReuniao);
  pendingConfirmationCount = this.store.selectSignal(selectConfirmacoesPendentesPorReuniao);
  pendingConfirmations     = this.store.selectSignal(selectReunioesComConfirmacaoPendente);

  private averageBackend = this.store.selectSignal(selectAverageTime);
  private averageLocal   = this.store.selectSignal(selectDuracaoMediaLocal);
  private reunioesPorMes = this.store.selectSignal(selectReunioesPorMes);
  private duracaoPorMes  = this.store.selectSignal(selectDuracaoMediaPorMes);

  podecriarReuniao = computed(() => this.auth.temQualquerPermissao(['ROLE_ADMIN', 'ROLE_ORGANIZADOR']));

  avgDuration = computed(() => {
    const b = this.averageBackend();
    return b != null ? Math.round(b) : (this.averageLocal() ?? 0);
  });

  // Variação real em relação ao mês anterior (substitui os "+12%" / "-8%" fixos)
  meetingsThisMonthChange = computed(() => {
    const s = this.reunioesPorMes();
    const n = s.realizadas.length;
    return variacaoPct(s.realizadas[n - 1], s.realizadas[n - 2]);
  });

  avgDurationChange = computed(() => {
    const s = this.duracaoPorMes();
    const n = s.minutos.length;
    return variacaoPct(s.minutos[n - 1], s.minutos[n - 2]);
  });

  // ─── Gráfico: reuniões por mês (barras, Chart.js) ─────────────────────────
  chartData = computed<ChartData<'bar'>>(() => {
    const s = this.reunioesPorMes();
    const ultimo = s.realizadas.length - 1;
    return {
      labels: s.labels,
      datasets: [{
        label: 'Reuniões',
        data: s.realizadas,
        // mês atual em destaque, demais com opacidade reduzida
        backgroundColor: s.realizadas.map((_, i) =>
          i === ultimo ? CHART_SERIES.primary : withAlpha(CHART_SERIES.primary, 0.45)),
        hoverBackgroundColor: CHART_SERIES.primary,
        borderRadius: 4,
        borderSkipped: 'bottom',
        maxBarThickness: 32,
      }],
    };
  });

  readonly chartOptions: ChartOptions<'bar'> = {
    plugins: { legend: { display: false } },
  };

  ngOnInit(): void {
    // O effect faz exhaustMap: se Relatórios já disparou, esta chamada é ignorada
    this.store.dispatch(IndicadoresActions.carregar());
  }

  formatDate(dateStr: string): string {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]}`;
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'Agendada', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluída' };
    return m[s] ?? s;
  }

  statusColor(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'var(--color-primary)', EM_ANDAMENTO: 'var(--color-warning)', CONCLUIDO: 'var(--color-success)' };
    return m[s] ?? 'var(--color-text-secondary)';
  }

  statusBg(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'rgba(6,182,212,0.15)', EM_ANDAMENTO: 'rgba(245,158,11,0.15)', CONCLUIDO: 'rgba(16,185,129,0.15)' };
    return m[s] ?? 'rgba(148,163,184,0.1)';
  }

  taskStatusLabel(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'Pendente', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluída' };
    return m[s] ?? s;
  }

  taskStatusColor(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'var(--color-text-muted)', EM_ANDAMENTO: 'var(--color-warning)', CONCLUIDO: 'var(--color-success)' };
    return m[s] ?? 'var(--color-text-muted)';
  }

  taskStatusBg(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'rgba(148,163,184,0.1)', EM_ANDAMENTO: 'rgba(245,158,11,0.15)', CONCLUIDO: 'rgba(16,185,129,0.15)' };
    return m[s] ?? 'rgba(148,163,184,0.1)';
  }
}
