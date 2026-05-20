import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MeetingService } from '../../core/services/meeting.service';
import { TaskService } from '../../core/services/task.service';
import { ParticipantService } from '../../core/services/participant.service';
import { AuthService } from '../../core/services/auth.service';
import { Meeting } from '../../core/models/meeting.model';
import { Task } from '../../core/models/task.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  styles: [`
    .stat-card { transition: border-color 0.15s, box-shadow 0.15s; }
    .meeting-card { transition: border-color 0.15s, box-shadow 0.15s; cursor: pointer; }
    .meeting-card:hover { border-color: var(--color-primary) !important; box-shadow: 0 0 0 1px rgba(6,182,212,0.15); }
    .chart-bar { transition: background 0.2s; border-radius: 4px 4px 0 0; }
    .chart-bar:hover { background: var(--color-primary) !important; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.8s linear infinite; }
  `],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
  readonly router = inject(Router);
  private meetingService = inject(MeetingService);
  private taskService = inject(TaskService);
  private participantService = inject(ParticipantService);
  private auth = inject(AuthService);

  meetings = signal<Meeting[]>([]);
  tasks = signal<Task[]>([]);
  participantCount = signal<Record<number, number>>({});
  loading = signal(true);

  podecriarReuniao = computed(() => this.auth.temQualquerPermissao(['ROLE_ADMIN', 'ROLE_ORGANIZADOR']));

  readonly chartBars = [
    { label: 'Jan', count: 3, pct: 35, highlight: false },
    { label: 'Fev', count: 2, pct: 22, highlight: false },
    { label: 'Mar', count: 5, pct: 58, highlight: false },
    { label: 'Abr', count: 4, pct: 47, highlight: false },
    { label: 'Mai', count: 7, pct: 82, highlight: false },
    { label: 'Jun', count: 5, pct: 60, highlight: false },
    { label: 'Jul', count: 3, pct: 35, highlight: false },
    { label: 'Ago', count: 6, pct: 70, highlight: false },
    { label: 'Set', count: 4, pct: 47, highlight: false },
    { label: 'Out', count: 8, pct: 95, highlight: true  },
    { label: 'Nov', count: 3, pct: 35, highlight: false },
    { label: 'Dez', count: 5, pct: 58, highlight: false },
  ];

  meetingsThisMonth = computed(() => {
    const now = new Date();
    return this.meetings().filter(m => {
      const d = new Date(m.meetingDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  });

  meetingsThisMonthChange = computed(() => {
    const count = this.meetingsThisMonth();
    return count > 0 ? 12 : 0;
  });

  avgDuration = computed(() => {
    const all = this.meetings().filter(m => m.duration);
    if (!all.length) return 0;
    return Math.round(all.reduce((s, m) => s + (m.duration ?? 0), 0) / all.length);
  });

  pendingTasks = computed(() =>
    this.tasks().filter(t => t.status === 'PENDENTE').length
  );

  upcomingMeetings = computed(() =>
    this.meetings()
      .filter(m => m.status !== 'CONCLUIDO')
      .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime())
      .slice(0, 4)
  );

  recentTasks = computed(() =>
    this.tasks()
      .filter(t => t.status !== 'CONCLUIDA')
      .slice(0, 3)
  );

  pendingConfirmations = computed(() =>
    this.meetings()
      .filter(m => m.status === 'NAO_INICIADO')
      .slice(0, 3)
  );

  async ngOnInit(): Promise<void> {
    try {
      const [meetings, tasks, participants] = await Promise.all([
        this.meetingService.listar(),
        this.taskService.listar(),
        this.participantService.listar().catch(() => []),
      ]);
      this.meetings.set(meetings);
      this.tasks.set(tasks);
      const countMap: Record<number, number> = {};
      for (const p of participants) {
        const mid = p.meeting.id;
        countMap[mid] = (countMap[mid] ?? 0) + 1;
      }
      this.participantCount.set(countMap);
    } catch {
      // dashboard degrades gracefully
    } finally {
      this.loading.set(false);
    }
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
    const m: Record<string, string> = { PENDENTE: 'Pendente', EM_ANDAMENTO: 'Em andamento', CONCLUIDA: 'Concluída' };
    return m[s] ?? s;
  }

  taskStatusColor(s: string): string {
    const m: Record<string, string> = { PENDENTE: 'var(--color-text-muted)', EM_ANDAMENTO: 'var(--color-warning)', CONCLUIDA: 'var(--color-success)' };
    return m[s] ?? 'var(--color-text-muted)';
  }

  taskStatusBg(s: string): string {
    const m: Record<string, string> = { PENDENTE: 'rgba(148,163,184,0.1)', EM_ANDAMENTO: 'rgba(245,158,11,0.15)', CONCLUIDA: 'rgba(16,185,129,0.15)' };
    return m[s] ?? 'rgba(148,163,184,0.1)';
  }
}
