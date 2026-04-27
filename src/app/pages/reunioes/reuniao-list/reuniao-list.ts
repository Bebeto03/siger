import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService } from '../../../core/services/meeting.service';
import { Meeting, MeetingStatus } from '../../../core/models/meeting.model';
import { NotificationService } from '../../../core/services/notification.service';
import { LogService } from '../../../core/services/log.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastComponent } from '../../../shared/components/toast/toast';

@Component({
  selector: 'app-reuniao-list',
  standalone: true,
  imports: [FormsModule, ToastComponent],
  styles: [`
    .meeting-card { transition: border-color 0.15s, box-shadow 0.15s; cursor: pointer; }
    .meeting-card:hover { border-color: var(--color-primary) !important; box-shadow: 0 0 0 1px rgba(6,182,212,0.2); }
    .btn-action { transition: opacity 0.15s; }
    .btn-action:hover { opacity: 0.75; }
    .btn-new:hover { background: var(--color-primary-dark) !important; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.8s linear infinite; }
  `],
  templateUrl: './reuniao-list.html'
})
export class ReuniaoList implements OnInit {
  private meetingService = inject(MeetingService);
  private notify         = inject(NotificationService);
  private logService     = inject(LogService);
  private auth           = inject(AuthService);
  private router         = inject(Router);

  meetings    = signal<Meeting[]>([]);
  loading     = signal(false);
  activeView  = signal<'list' | 'calendar'>('list');
  searchText  = signal('');
  deleteTarget = signal<Meeting | null>(null);
  deleting    = signal(false);

  calendarYear  = signal(new Date().getFullYear());
  calendarMonth = signal(new Date().getMonth());

  readonly views      = [{ id: 'list' as const, label: 'Lista' }, { id: 'calendar' as const, label: 'Calendário' }];
  readonly weekDays   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  readonly monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  filtered = computed(() => {
    const q = this.searchText().toLowerCase().trim();
    if (!q) return this.meetings();
    return this.meetings().filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  stats = computed(() => {
    const all = this.meetings();
    return [
      { label: 'Total',        value: all.length,                                              color: 'var(--color-text-primary)' },
      { label: 'Não iniciadas', value: all.filter(m => m.status === 'NAO_INICIADO').length,   color: 'var(--color-primary)'      },
      { label: 'Em andamento', value: all.filter(m => m.status === 'EM_ANDAMENTO').length,    color: 'var(--color-warning)'      },
      { label: 'Concluídas',   value: all.filter(m => m.status === 'CONCLUIDO').length,       color: 'var(--color-success)'      },
    ];
  });

  calendarLabel = computed(() => `${this.monthNames[this.calendarMonth()]} ${this.calendarYear()}`);

  calendarCells = computed(() => {
    const year  = this.calendarYear();
    const month = this.calendarMonth();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const cells: { day: number | null; isToday: boolean; meetings: Meeting[] }[] = [];

    for (let i = 0; i < firstDay; i++) cells.push({ day: null, isToday: false, meetings: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday  = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
      const meetings = this.meetings().filter(m => {
        const date = new Date(m.meetingDate);
        return date.getDate() === d && date.getMonth() === month && date.getFullYear() === year;
      });
      cells.push({ day: d, isToday, meetings });
    }
    return cells;
  });

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.meetings.set(await this.meetingService.listar());
    } catch {
      this.notify.error('Erro ao carregar reuniões.');
    } finally {
      this.loading.set(false);
    }
  }

  goCreate(): void  { this.router.navigate(['/reunioes/nova']); }
  goEdit(id: number): void   { this.router.navigate(['/reunioes', id, 'editar']); }
  goDetail(id: number): void { this.router.navigate(['/reunioes', id]); }

  confirmDelete(m: Meeting): void { this.deleteTarget.set(m); }

  async executeDelete(): Promise<void> {
    const m = this.deleteTarget();
    if (!m?.id) return;
    this.deleting.set(true);
    try {
      await this.meetingService.excluir(m.id);
      this.logService.registrar(`Reunião excluída: ${m.title}`, this.auth.getNomeUsuario()).catch(() => {});
      this.notify.success('Reunião excluída.');
      this.deleteTarget.set(null);
      await this.load();
    } catch {
      this.notify.error('Erro ao excluir reunião.');
    } finally {
      this.deleting.set(false);
    }
  }

  prevMonth(): void {
    if (this.calendarMonth() === 0) { this.calendarMonth.set(11); this.calendarYear.update(y => y - 1); }
    else this.calendarMonth.update(m => m - 1);
  }

  nextMonth(): void {
    if (this.calendarMonth() === 11) { this.calendarMonth.set(0); this.calendarYear.update(y => y + 1); }
    else this.calendarMonth.update(m => m + 1);
  }

  dayOf(dateStr: string): string {
    return new Date(dateStr).getDate().toString().padStart(2, '0');
  }

  monthOf(dateStr: string): string {
    return this.monthNames[new Date(dateStr).getMonth()].substring(0, 3).toUpperCase();
  }

  timeOf(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }

  statusLabel(status: MeetingStatus): string {
    const map: Record<MeetingStatus, string> = {
      NAO_INICIADO: 'Não iniciada',
      EM_ANDAMENTO: 'Em andamento',
      CONCLUIDO:    'Concluída',
    };
    return map[status] ?? status;
  }

  statusColor(status: MeetingStatus): string {
    const map: Record<MeetingStatus, string> = {
      NAO_INICIADO: 'var(--color-primary)',
      EM_ANDAMENTO: 'var(--color-warning)',
      CONCLUIDO:    'var(--color-success)',
    };
    return map[status] ?? 'var(--color-text-secondary)';
  }

  statusBg(status: MeetingStatus): string {
    const map: Record<MeetingStatus, string> = {
      NAO_INICIADO: 'rgba(6,182,212,0.15)',
      EM_ANDAMENTO: 'rgba(245,158,11,0.15)',
      CONCLUIDO:    'rgba(16,185,129,0.15)',
    };
    return map[status] ?? 'rgba(148,163,184,0.1)';
  }
}
