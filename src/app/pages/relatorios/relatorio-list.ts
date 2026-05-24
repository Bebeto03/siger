import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MeetingService } from '../../core/services/meeting.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';
import { Meeting } from '../../core/models/meeting.model';

const MONTHS_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const DAYS  = ['Seg','Ter','Qua','Qui','Sex'];

@Component({
  selector: 'app-relatorio-list',
  standalone: true,
  imports: [ToastComponent, DecimalPipe],
  styles: [`
    .chart-bar { transition: opacity 0.2s; border-radius: 6px 6px 0 0; cursor: default; }
    .chart-bar:hover { opacity: 0.8; }
    .heat-cell { border-radius: 4px; cursor: default; transition: opacity 0.15s; }
    .heat-cell:hover { opacity: 0.7; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.8s linear infinite; }
  `],
  templateUrl: './relatorio.html'
})
export class RelatorioList implements OnInit {
  readonly notify = inject(NotificationService);
  private meetingService   = inject(MeetingService);
  private dashboardService = inject(DashboardService);

  loading        = signal(true);
  meetingList    = signal<Meeting[]>([]);
  attendanceRate = signal<number | null>(null);

  readonly hours      = HOURS;
  readonly heatLegend = [0.1, 0.25, 0.4, 0.55, 0.7];

  totalMeetings = computed(() => this.meetingList().length);

  avgDuration = computed(() => {
    const all = this.meetingList().filter(m => m.duration);
    if (!all.length) return 0;
    return Math.round(all.reduce((s, m) => s + (m.duration ?? 0), 0) / all.length);
  });

  concluido = computed(() => {
    const all = this.meetingList();
    if (!all.length) return 0;
    return all.filter(m => m.status === 'CONCLUIDO').length / all.length;
  });

  agendado = computed(() => {
    const all = this.meetingList();
    if (!all.length) return 0;
    return all.filter(m => m.status === 'NAO_INICIADO').length / all.length;
  });

  emAndamento = computed(() => {
    const all = this.meetingList();
    if (!all.length) return 0;
    return all.filter(m => m.status === 'EM_ANDAMENTO').length / all.length;
  });

  statusDistribution = computed(() => {
    const all = this.meetingList();
    const c = all.filter(m => m.status === 'CONCLUIDO').length;
    const a = all.filter(m => m.status === 'NAO_INICIADO').length;
    const e = all.filter(m => m.status === 'EM_ANDAMENTO').length;
    return [
      { label: 'Concluídas',   count: c, color: '#10B981' },
      { label: 'Agendadas',    count: a, color: '#06B6D4' },
      { label: 'Em andamento', count: e, color: '#F59E0B' },
    ];
  });

  // Últimos 6 meses — quantidade de reuniões criadas por mês (dado real)
  attendanceBars = computed(() => {
    const now = new Date();
    const bars = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const month = d.getMonth();
      const year  = d.getFullYear();
      const count = this.meetingList().filter(m => {
        const md = new Date(m.meetingDate);
        return md.getMonth() === month && md.getFullYear() === year;
      }).length;
      return { month: MONTHS_LABELS[month], count };
    });
    const max = Math.max(...bars.map(b => b.count), 1);
    return bars.map(b => ({ ...b, pct: Math.round((b.count / max) * 100) }));
  });

  // Heatmap — frequência de reuniões por dia da semana e horário (dado real)
  heatmapRows = computed(() => {
    const grid: number[][] = Array.from({ length: 5 }, () => new Array(10).fill(0));
    for (const m of this.meetingList()) {
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
      cells: grid[di].map(v => v / max),
    }));
  });

  async ngOnInit(): Promise<void> {
    try {
      const meetings = await this.meetingService.listar();
      this.meetingList.set(meetings);
    } catch {
      // degraded gracefully
    } finally {
      this.loading.set(false);
    }
    this.dashboardService.attendanceGeneral()
      .then(r => this.attendanceRate.set(r != null && isFinite(r) ? r : null))
      .catch(() => {});
  }
}
