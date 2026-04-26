import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService, Meeting } from '../../core/services/meeting.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';

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
  template: `
    <div class="flex flex-col min-h-full">
      <app-toast />

      <!-- Top Bar -->
      <div class="flex items-center justify-between px-7 py-5 border-b" style="background: var(--color-surface); border-color: var(--color-border)">
        <div>
          <h1 class="text-xl font-bold" style="color: var(--color-text-primary)">Reuniões</h1>
          <p class="text-sm mt-0.5" style="color: var(--color-text-muted)">Gerencie todas as suas reuniões</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- View toggle -->
          <div class="flex items-center gap-1 rounded-lg p-1" style="background: var(--color-surface-light)">
            @for (v of views; track v.id) {
              <button (click)="activeView.set(v.id)"
                class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                [style.background]="activeView() === v.id ? 'var(--color-surface-hover)' : 'transparent'"
                [style.color]="activeView() === v.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)'"
                style="border: none; cursor: pointer;">
                {{ v.label }}
              </button>
            }
          </div>
          <button (click)="goCreate()" class="btn-new flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style="background: var(--color-primary); color: #000; border: none; cursor: pointer; transition: background 0.15s">
            + Nova Reunião
          </button>
        </div>
      </div>

      <div class="p-7">
        <!-- Search -->
        <div class="relative mb-5">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style="color: var(--color-text-muted)">🔍</span>
          <input type="text" [ngModel]="searchText()" (ngModelChange)="searchText.set($event)"
            placeholder="Buscar reuniões por título, local ou data..."
            class="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
            style="background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-primary)" />
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="flex items-center justify-center py-20 gap-3">
            <div class="spinner w-5 h-5 rounded-full border-2"
                 style="border-color: var(--color-primary); border-top-color: transparent"></div>
            <span class="text-sm" style="color: var(--color-text-muted)">Carregando reuniões...</span>
          </div>
        } @else if (activeView() === 'list') {

          <!-- Stats -->
          <div class="grid grid-cols-4 gap-4 mb-6">
            @for (stat of stats(); track stat.label) {
              <div class="rounded-xl p-4" style="background: var(--color-surface); border: 1px solid var(--color-border)">
                <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted)">{{ stat.label }}</p>
                <p class="text-3xl font-bold mt-2" [style.color]="stat.color">{{ stat.value }}</p>
              </div>
            }
          </div>

          <!-- List -->
          <div class="flex flex-col gap-3">
            @for (m of filtered(); track m.id) {
              <div class="meeting-card rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)"
                   (click)="goDetail(m.id!)">
                <div class="flex items-center gap-4">

                  <!-- Date block -->
                  <div class="flex flex-col items-center justify-center rounded-xl shrink-0"
                       style="width: 56px; height: 56px; background: var(--color-surface-light)">
                    <span class="text-lg font-extrabold leading-none" style="color: var(--color-text-primary)">
                      {{ dayOf(m.meetingDate) }}
                    </span>
                    <span class="text-xs mt-1" style="color: var(--color-text-muted)">
                      {{ monthOf(m.meetingDate) }}
                    </span>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-semibold" style="color: var(--color-text-primary)">{{ m.title }}</span>
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            [style.background]="statusBg(m.status!)"
                            [style.color]="statusColor(m.status!)">
                        {{ statusLabel(m.status!) }}
                      </span>
                    </div>
                    <p class="text-xs mt-1 truncate" style="color: var(--color-text-muted)">{{ m.description }}</p>
                    <div class="flex gap-4 mt-2 flex-wrap">
                      <span class="text-xs flex items-center gap-1" style="color: var(--color-text-secondary)">
                        🕐 {{ timeOf(m.meetingDate) }} · {{ m.duration }}min
                      </span>
                      <span class="text-xs flex items-center gap-1" style="color: var(--color-text-secondary)">
                        📍 {{ m.location }}
                      </span>
                      <span class="text-xs flex items-center gap-1" style="color: var(--color-text-secondary)">
                        👥 {{ confirmedCount(m) }}/{{ m.participants.length }} confirmados
                      </span>
                      <span class="text-xs flex items-center gap-1" style="color: var(--color-text-secondary)">
                        📋 {{ m.topics.length }} pautas
                      </span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-2 shrink-0" (click)="$event.stopPropagation()">
                    <button (click)="goDetail(m.id!)" class="btn-action px-3 py-1.5 rounded-lg text-xs font-medium"
                      style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
                      👁 Ver
                    </button>
                    <button (click)="goEdit(m.id!)" class="btn-action px-3 py-1.5 rounded-lg text-xs font-medium"
                      style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
                      ✏️ Editar
                    </button>
                    <button (click)="confirmDelete(m)" class="btn-action px-3 py-1.5 rounded-lg text-xs font-medium"
                      style="background: rgba(239,68,68,0.1); color: var(--color-danger); border: 1px solid rgba(239,68,68,0.2); cursor: pointer">
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="text-center py-20">
                <div class="text-5xl mb-4">📅</div>
                <p class="font-medium mb-1" style="color: var(--color-text-secondary)">
                  {{ searchText() ? 'Nenhuma reunião encontrada.' : 'Nenhuma reunião cadastrada.' }}
                </p>
                @if (!searchText()) {
                  <p class="text-sm mb-5" style="color: var(--color-text-muted)">Crie a primeira reunião para começar.</p>
                  <button (click)="goCreate()" class="px-5 py-2.5 rounded-lg text-sm font-semibold"
                    style="background: var(--color-primary); color: #000; border: none; cursor: pointer">
                    + Nova Reunião
                  </button>
                }
              </div>
            }
          </div>

        } @else {
          <!-- Calendar View (placeholder visual) -->
          <div class="rounded-xl p-6" style="background: var(--color-surface); border: 1px solid var(--color-border)">
            <div class="flex items-center justify-between mb-5">
              <h3 class="text-lg font-bold" style="color: var(--color-text-primary)">{{ calendarLabel() }}</h3>
              <div class="flex gap-2">
                <button (click)="prevMonth()" class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
                  ← Anterior
                </button>
                <button (click)="nextMonth()" class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
                  Próximo →
                </button>
              </div>
            </div>
            <div class="grid grid-cols-7 gap-1">
              @for (d of weekDays; track d) {
                <div class="py-2 text-center text-xs font-semibold" style="color: var(--color-text-muted)">{{ d }}</div>
              }
              @for (cell of calendarCells(); track $index) {
                <div class="p-2 rounded-lg min-h-16 cursor-pointer"
                     [style.background]="cell.isToday ? 'rgba(6,182,212,0.1)' : 'var(--color-surface-light)'"
                     [style.border]="cell.isToday ? '1px solid rgba(6,182,212,0.4)' : '1px solid transparent'">
                  <div class="text-xs mb-1 font-semibold"
                       [style.color]="cell.isToday ? 'var(--color-primary)' : 'var(--color-text-secondary)'">
                    {{ cell.day || '' }}
                  </div>
                  @for (m of cell.meetings; track m.id) {
                    <div (click)="goDetail(m.id!)"
                         class="text-xs px-1.5 py-0.5 rounded mb-0.5 truncate font-medium cursor-pointer"
                         style="background: rgba(6,182,212,0.2); color: var(--color-primary)">
                      {{ m.title }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Delete confirm -->
    @if (deleteTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.75)">
        <div class="rounded-2xl w-full max-w-sm mx-4 p-6"
             style="background: var(--color-surface); border: 1px solid var(--color-border)">
          <div class="text-3xl mb-4 text-center">⚠️</div>
          <h3 class="text-lg font-semibold text-center mb-2" style="color: var(--color-text-primary)">Confirmar Exclusão</h3>
          <p class="text-sm text-center mb-6" style="color: var(--color-text-secondary)">
            Tem certeza que deseja excluir
            <strong style="color: var(--color-text-primary)">{{ deleteTarget()?.title }}</strong>?
          </p>
          <div class="flex gap-3">
            <button (click)="deleteTarget.set(null)" class="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
              Cancelar
            </button>
            <button (click)="executeDelete()" [disabled]="deleting()"
              class="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold"
              [style.opacity]="deleting() ? '0.7' : '1'"
              style="background: var(--color-danger); color: #fff; border: none; cursor: pointer">
              {{ deleting() ? 'Excluindo...' : 'Sim, Excluir' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ReuniaoList implements OnInit {
  private meetingService = inject(MeetingService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  meetings = signal<Meeting[]>([]);
  loading = signal(false);
  activeView = signal<'list' | 'calendar'>('list');
  searchText = signal('');
  deleteTarget = signal<Meeting | null>(null);
  deleting = signal(false);

  calendarYear = signal(new Date().getFullYear());
  calendarMonth = signal(new Date().getMonth());

  readonly views = [{ id: 'list' as const, label: 'Lista' }, { id: 'calendar' as const, label: 'Calendário' }];
  readonly weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
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
      { label: 'Total', value: all.length, color: 'var(--color-text-primary)' },
      { label: 'Agendadas', value: all.filter(m => m.status === 'AGENDADA').length, color: 'var(--color-primary)' },
      { label: 'Em andamento', value: all.filter(m => m.status === 'EM_ANDAMENTO').length, color: 'var(--color-warning)' },
      { label: 'Finalizadas', value: all.filter(m => m.status === 'FINALIZADA').length, color: 'var(--color-success)' },
    ];
  });

  calendarLabel = computed(() =>
    `${this.monthNames[this.calendarMonth()]} ${this.calendarYear()}`
  );

  calendarCells = computed(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const cells: { day: number | null; isToday: boolean; meetings: Meeting[] }[] = [];

    for (let i = 0; i < firstDay; i++) cells.push({ day: null, isToday: false, meetings: [] });

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
      const meetings = this.meetings().filter(m => {
        const date = new Date(m.meetingDate);
        return date.getDate() === d && date.getMonth() === month && date.getFullYear() === year;
      });
      cells.push({ day: d, isToday, meetings });
    }
    return cells;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

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

  goCreate(): void { this.router.navigate(['/reunioes/nova']); }
  goEdit(id: number): void { this.router.navigate(['/reunioes', id, 'editar']); }
  goDetail(id: number): void { this.router.navigate(['/reunioes', id]); }

  confirmDelete(m: Meeting): void { this.deleteTarget.set(m); }

  async executeDelete(): Promise<void> {
    const m = this.deleteTarget();
    if (!m?.id) return;
    this.deleting.set(true);
    try {
      await this.meetingService.excluir(m.id);
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

  confirmedCount(m: Meeting): number {
    return m.participants.filter(p => p.status === 'SIM').length;
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      AGENDADA: 'Agendada', EM_ANDAMENTO: 'Em andamento',
      FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada',
    };
    return map[status] ?? status;
  }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      AGENDADA: 'var(--color-primary)', EM_ANDAMENTO: 'var(--color-warning)',
      FINALIZADA: 'var(--color-success)', CANCELADA: 'var(--color-danger)',
    };
    return map[status] ?? 'var(--color-text-secondary)';
  }

  statusBg(status: string): string {
    const map: Record<string, string> = {
      AGENDADA: 'rgba(6,182,212,0.15)', EM_ANDAMENTO: 'rgba(245,158,11,0.15)',
      FINALIZADA: 'rgba(16,185,129,0.15)', CANCELADA: 'rgba(239,68,68,0.15)',
    };
    return map[status] ?? 'rgba(148,163,184,0.1)';
  }
}
