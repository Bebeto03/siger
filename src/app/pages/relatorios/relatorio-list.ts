import { Component, inject, OnInit, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ChartData, ChartOptions } from 'chart.js';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';
import { ChartComponent } from '../../shared/components/chart/chart';
import { CHART_SERIES, CHART_STATUS, withAlpha } from '../../shared/components/chart/chart-theme';
import {
  IndicadoresActions,
  selectAttendanceGeneral,
  selectAverageTime,
  selectComparecimentoPorMes,
  selectDuracaoMediaLocal,
  selectDuracaoMediaPorMes,
  selectError,
  selectLoading,
  selectLoaded,
  selectMeetings,
  selectReunioesPorMes,
  selectReunioesPorStatus,
  selectTarefasPorStatus,
  selectTaxaConclusao,
  selectTotalReunioes,
} from '../../store/indicadores';

const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const DAYS  = ['Seg','Ter','Qua','Qui','Sex'];

@Component({
  selector: 'app-relatorio-list',
  standalone: true,
  imports: [ToastComponent, DecimalPipe, ChartComponent],
  styles: [`
    .heat-cell { border-radius: 4px; cursor: default; transition: opacity 0.15s; }
    .heat-cell:hover { opacity: 0.7; }
    .card { background: var(--color-surface); border: 1px solid var(--color-border); }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.8s linear infinite; }
  `],
  templateUrl: './relatorio.html'
})
export class RelatorioList implements OnInit {
  readonly notify = inject(NotificationService);
  private store = inject(Store);

  // ─── Estado vindo do store (NgRx) ─────────────────────────────────────────
  loading = this.store.selectSignal(selectLoading);
  loaded  = this.store.selectSignal(selectLoaded);
  error   = this.store.selectSignal(selectError);

  totalMeetings     = this.store.selectSignal(selectTotalReunioes);
  attendanceBackend = this.store.selectSignal(selectAttendanceGeneral);
  averageBackend    = this.store.selectSignal(selectAverageTime);
  averageLocal      = this.store.selectSignal(selectDuracaoMediaLocal);
  taxaConclusao     = this.store.selectSignal(selectTaxaConclusao);

  private meetings           = this.store.selectSignal(selectMeetings);
  private reunioesPorMes     = this.store.selectSignal(selectReunioesPorMes);
  private comparecimentoMes  = this.store.selectSignal(selectComparecimentoPorMes);
  private duracaoMes         = this.store.selectSignal(selectDuracaoMediaPorMes);
  private reunioesPorStatus  = this.store.selectSignal(selectReunioesPorStatus);
  private tarefasPorStatus   = this.store.selectSignal(selectTarefasPorStatus);

  readonly hours      = HOURS;
  readonly heatLegend = [0.1, 0.25, 0.4, 0.55, 0.7];

  avgDuration = computed(() => {
    const b = this.averageBackend();
    return b != null ? Math.round(b) : this.averageLocal();
  });

  semDados = computed(() => this.loaded() && this.totalMeetings() === 0);

  // ─── Gráfico 1: reuniões por mês (barras empilhadas: realizadas × canceladas)
  reunioesPorMesData = computed<ChartData<'bar'>>(() => {
    const s = this.reunioesPorMes();
    return {
      labels: s.labels,
      datasets: [
        {
          label: 'Realizadas / agendadas',
          data: s.realizadas,
          backgroundColor: CHART_SERIES.primary,
          borderRadius: 4,
          borderSkipped: 'bottom',
          maxBarThickness: 28,
        },
        {
          label: 'Canceladas',
          data: s.canceladas,
          backgroundColor: CHART_SERIES.danger,
          borderRadius: 4,
          borderSkipped: 'bottom',
          maxBarThickness: 28,
        },
      ],
    };
  });

  readonly reunioesPorMesOptions: ChartOptions<'bar'> = {
    scales: {
      x: { stacked: true },
      y: { stacked: true },
    },
  };

  // ─── Gráfico 2: taxa de comparecimento por mês (linha)
  comparecimentoData = computed<ChartData<'line'>>(() => {
    const s = this.comparecimentoMes();
    return {
      labels: s.labels,
      datasets: [{
        label: 'Comparecimento (%)',
        data: s.taxa,
        borderColor: CHART_SERIES.success,
        backgroundColor: withAlpha(CHART_SERIES.success, 0.12),
        pointBackgroundColor: CHART_SERIES.success,
        pointBorderColor: '#111827',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        spanGaps: false,
      }],
    };
  });

  readonly comparecimentoOptions: ChartOptions<'line'> = {
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}% de comparecimento` } },
    },
    scales: {
      y: { min: 0, max: 100, ticks: { callback: v => `${v}%` } },
    },
  };

  // ─── Gráfico 3: duração média por mês (linha)
  duracaoData = computed<ChartData<'line'>>(() => {
    const s = this.duracaoMes();
    return {
      labels: s.labels,
      datasets: [{
        label: 'Duração média (min)',
        data: s.minutos,
        borderColor: CHART_SERIES.accent,
        backgroundColor: withAlpha(CHART_SERIES.accent, 0.12),
        pointBackgroundColor: CHART_SERIES.accent,
        pointBorderColor: '#111827',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        spanGaps: false,
      }],
    };
  });

  readonly duracaoOptions: ChartOptions<'line'> = {
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} min em média` } },
    },
    scales: {
      y: { ticks: { callback: v => `${v} min` } },
    },
  };

  // ─── Gráfico 4: distribuição de status das reuniões (rosca)
  statusData = computed<ChartData<'doughnut'>>(() => {
    const d = this.reunioesPorStatus();
    return {
      labels: d.labels,
      datasets: [{
        data: d.values,
        backgroundColor: d.keys.map(k => CHART_STATUS[k]),
        borderColor: '#111827',
        borderWidth: 2,
        hoverOffset: 6,
      }],
    };
  });

  readonly statusOptions: ChartOptions<'doughnut'> = {
    cutout: '68%',
    scales: { x: { display: false }, y: { display: false } },
    // legenda custom no template (com contagens) — a nativa ficaria duplicada
    plugins: { legend: { display: false } },
  };

  statusLegend = computed(() => {
    const d = this.reunioesPorStatus();
    return d.keys.map((k, i) => ({ key: k, label: d.labels[i], count: d.values[i], color: CHART_STATUS[k] }));
  });

  // ─── Gráfico 5: tarefas por status (barras)
  tarefasData = computed<ChartData<'bar'>>(() => {
    const d = this.tarefasPorStatus();
    return {
      labels: d.labels,
      datasets: [{
        label: 'Tarefas',
        data: d.values,
        backgroundColor: d.keys.map(k => CHART_STATUS[k]),
        borderRadius: 4,
        borderSkipped: 'bottom',
        maxBarThickness: 40,
      }],
    };
  });

  readonly tarefasOptions: ChartOptions<'bar'> = {
    plugins: { legend: { display: false } },
  };

  totalTarefas = computed(() => this.tarefasPorStatus().total);

  // ─── Heatmap — frequência de reuniões por dia da semana e horário
  heatmapRows = computed(() => {
    const grid: number[][] = Array.from({ length: 5 }, () => new Array(10).fill(0));
    for (const m of this.meetings()) {
      if (!m.meetingDate) continue;
      const d      = new Date(m.meetingDate);
      const jsDay  = d.getDay(); // 0=Dom, 1=Seg, ..., 5=Sex, 6=Sáb
      if (jsDay === 0 || jsDay === 6) continue;
      const dayIdx  = jsDay - 1;       // Seg=0 ... Sex=4
      const hourIdx = d.getHours() - 8; // 08h=0 ... 17h=9
      if (hourIdx >= 0 && hourIdx < 10) grid[dayIdx][hourIdx]++;
    }
    const max = Math.max(...grid.flat(), 1);
    return DAYS.map((day, di) => ({
      day,
      cells: grid[di].map(v => ({ ratio: v / max, count: v })),
    }));
  });

  ngOnInit(): void {
    this.store.dispatch(IndicadoresActions.carregar());
  }

  recarregar(): void {
    this.store.dispatch(IndicadoresActions.carregar());
  }
}
