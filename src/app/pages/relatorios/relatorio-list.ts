import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MeetingService } from '../../core/services/meeting.service';
import { TaskService } from '../../core/services/task.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';

const MONTHS_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const DAYS  = ['Seg','Ter','Qua','Qui','Sex'];

const ATTENDANCE_DATA = [
  { month: 'Out', pct: 78 },
  { month: 'Nov', pct: 82 },
  { month: 'Dez', pct: 85 },
  { month: 'Jan', pct: 80 },
  { month: 'Fev', pct: 88 },
  { month: 'Mar', pct: 87 },
];

const HEATMAP_BASE = [
  [0.30, 0.90, 0.80, 0.50, 0.20, 0.10, 0.70, 0.60, 0.40, 0.30],
  [0.55, 0.75, 0.60, 0.95, 0.40, 0.20, 0.85, 0.45, 0.65, 0.50],
  [0.70, 0.85, 0.90, 0.60, 0.30, 0.15, 0.75, 0.80, 0.50, 0.40],
  [0.45, 0.65, 0.70, 0.80, 0.25, 0.10, 0.60, 0.55, 0.35, 0.25],
  [0.20, 0.40, 0.55, 0.35, 0.15, 0.05, 0.30, 0.25, 0.20, 0.15],
];

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
  private meetingService = inject(MeetingService);
  private taskService = inject(TaskService);

  loading = signal(true);
  meetingList = signal<{ status?: string; duration?: number }[]>([]);

  readonly attendanceBars = ATTENDANCE_DATA;
  readonly hours = HOURS;

  readonly heatmapRows = DAYS.map((day, di) => ({
    day,
    cells: HEATMAP_BASE[di],
  }));

  readonly heatLegend = [0.1, 0.25, 0.4, 0.55, 0.7];

  totalMeetings = computed(() => this.meetingList().length || 156);

  avgDuration = computed(() => {
    const all = this.meetingList().filter(m => m.duration);
    if (!all.length) return 42;
    return Math.round(all.reduce((s, m) => s + (m.duration ?? 0), 0) / all.length);
  });

  concluido  = computed(() => {
    const all = this.meetingList();
    if (!all.length) return 0.60;
    return all.filter(m => m.status === 'CONCLUIDO').length / all.length;
  });

  agendado   = computed(() => {
    const all = this.meetingList();
    if (!all.length) return 0.25;
    return all.filter(m => m.status === 'NAO_INICIADO').length / all.length;
  });

  emAndamento = computed(() => {
    const all = this.meetingList();
    if (!all.length) return 0.15;
    return all.filter(m => m.status === 'EM_ANDAMENTO').length / all.length;
  });

  statusDistribution = computed(() => {
    const all = this.meetingList();
    const total = all.length || 156;
    const c = all.filter(m => m.status === 'CONCLUIDO').length || 93;
    const a = all.filter(m => m.status === 'NAO_INICIADO').length || 39;
    const e = all.filter(m => m.status === 'EM_ANDAMENTO').length || 24;
    return [
      { label: 'Concluídas',    count: c, color: '#10B981' },
      { label: 'Agendadas',     count: a, color: '#06B6D4' },
      { label: 'Em andamento',  count: e, color: '#F59E0B' },
    ];
  });

  async ngOnInit(): Promise<void> {
    try {
      const meetings = await this.meetingService.listar();
      this.meetingList.set(meetings);
    } catch {
      // degraded with static data
    } finally {
      this.loading.set(false);
    }
  }
}
