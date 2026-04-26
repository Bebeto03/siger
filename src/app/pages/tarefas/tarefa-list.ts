import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { MeetingService } from '../../core/services/meeting.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';
import { Task, TaskStatus } from '../../core/models/task.model';
import { User } from '../../core/models/user.model';
import { Meeting } from '../../core/models/meeting.model';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'PENDENTE',     label: 'Pendente',      color: 'var(--color-text-muted)'  },
  { status: 'EM_ANDAMENTO', label: 'Em Andamento',  color: 'var(--color-warning)'     },
  { status: 'CONCLUIDA',    label: 'Concluída',      color: 'var(--color-success)'     },
];

@Component({
  selector: 'app-tarefa-list',
  standalone: true,
  imports: [FormsModule, ToastComponent],
  styles: [`
    .task-card { transition: border-color 0.15s, box-shadow 0.15s; cursor: pointer; }
    .task-card:hover { border-color: var(--color-primary) !important; box-shadow: 0 0 0 1px rgba(6,182,212,0.15); }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.8s linear infinite; }
    input, select, textarea {
      background: var(--color-surface-light);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text-primary);
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus, select:focus, textarea:focus { border-color: var(--color-primary); }
    select option { background: var(--color-surface-light); }
  `],
  template: `
    <div class="flex flex-col min-h-full">
      <app-toast />

      <!-- Top Bar -->
      <div class="flex items-center justify-between px-7 py-5 border-b" style="background: var(--color-surface); border-color: var(--color-border)">
        <div>
          <h1 class="text-xl font-bold" style="color: var(--color-text-primary)">Tarefas</h1>
          <p class="text-sm mt-0.5" style="color: var(--color-text-muted)">Gerencie tarefas vinculadas às reuniões</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Filtro por reunião -->
          <select [(ngModel)]="filterMeetingId" (ngModelChange)="filterMeetingId = $event"
            class="px-3 py-2 rounded-lg text-sm"
            style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-secondary)">
            <option [ngValue]="null">Todas as reuniões</option>
            @for (m of meetings(); track m.id) {
              <option [ngValue]="m.id">{{ m.title }}</option>
            }
          </select>
          <button (click)="openModal()" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style="background: var(--color-primary); color: #000; border: none; cursor: pointer">
            + Nova Tarefa
          </button>
        </div>
      </div>

      <!-- Kanban -->
      <div class="p-7">
        @if (loading()) {
          <div class="flex items-center justify-center py-20 gap-3">
            <div class="spinner w-5 h-5 rounded-full border-2"
                 style="border-color: var(--color-primary); border-top-color: transparent"></div>
            <span class="text-sm" style="color: var(--color-text-muted)">Carregando tarefas...</span>
          </div>
        } @else {
          <div class="flex gap-4" style="min-height: 60vh; align-items: flex-start">
            @for (col of columns; track col.status) {
              <div class="flex-1 min-w-64 flex flex-col gap-3">

                <!-- Column Header -->
                <div class="flex items-center gap-2 px-1 mb-1">
                  <div class="w-2 h-2 rounded-full shrink-0" [style.background]="col.color"></div>
                  <span class="text-sm font-bold" style="color: var(--color-text-primary)">{{ col.label }}</span>
                  <span class="px-2 py-0.5 rounded-lg text-xs font-semibold ml-1"
                    style="background: var(--color-surface-light); color: var(--color-text-muted)">
                    {{ tasksByStatus(col.status).length }}
                  </span>
                </div>

                <!-- Cards -->
                @for (t of tasksByStatus(col.status); track t.id) {
                  <div class="task-card rounded-xl p-4"
                       style="background: var(--color-surface); border: 1px solid var(--color-border)">
                    <div class="flex items-start justify-between gap-2 mb-3">
                      <span class="text-sm font-semibold leading-snug" style="color: var(--color-text-primary)">{{ t.title }}</span>
                      <button (click)="confirmDelete(t)"
                        class="shrink-0 text-xs px-2 py-1 rounded-lg"
                        style="background: rgba(239,68,68,0.08); color: var(--color-danger); border: 1px solid rgba(239,68,68,0.15); cursor: pointer">
                        🗑
                      </button>
                    </div>

                    @if (t.meeting?.title) {
                      <div class="flex items-center gap-1 mb-3">
                        <span class="text-xs" style="color: var(--color-text-muted)">📅 {{ t.meeting.title }}</span>
                      </div>
                    }

                    <div class="flex items-center justify-between mt-2">
                      <!-- Assignee avatar -->
                      @if (t.assignee?.name) {
                        <div class="flex items-center gap-2">
                          <div class="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                               style="background: linear-gradient(135deg, #6366F1, #8B5CF6); font-size: 9px">
                            {{ initials(t.assignee!.name!) }}
                          </div>
                          <span class="text-xs" style="color: var(--color-text-muted)">{{ t.assignee!.name }}</span>
                        </div>
                      } @else {
                        <span class="text-xs" style="color: var(--color-text-muted)">Sem responsável</span>
                      }

                      @if (t.dueDate) {
                        <span class="text-xs flex items-center gap-1" style="color: var(--color-text-muted)">
                          🕐 {{ formatDate(t.dueDate) }}
                        </span>
                      }
                    </div>

                    <!-- Move status buttons -->
                    <div class="flex gap-1 mt-3 pt-3 border-t" style="border-color: var(--color-border)">
                      @for (c of columns; track c.status) {
                        @if (c.status !== col.status) {
                          <button (click)="moveTask(t, c.status)"
                            class="flex-1 py-1 rounded-lg text-xs font-medium"
                            [style.color]="c.color"
                            style="background: var(--color-surface-light); border: 1px solid var(--color-border); cursor: pointer">
                            → {{ c.label }}
                          </button>
                        }
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="rounded-xl p-6 text-center"
                       style="border: 2px dashed var(--color-border)">
                    <p class="text-xs" style="color: var(--color-text-muted)">Nenhuma tarefa aqui.</p>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>

    <!-- Modal Nova Tarefa -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.7); backdrop-filter: blur(4px)">
        <div class="rounded-2xl w-full mx-4 p-6" style="max-width: 480px; background: var(--color-surface); border: 1px solid var(--color-border)">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-bold" style="color: var(--color-text-primary)">Nova Tarefa</h2>
            <button (click)="closeModal()" style="background: var(--color-surface-light); border: none; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; color: var(--color-text-muted); font-size: 16px">✕</button>
          </div>

          <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Título *</label>
          <input [(ngModel)]="form.title" placeholder="Descreva a tarefa..."
            class="w-full px-3 py-2.5 mb-4" />

          <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Reunião *</label>
          <select [(ngModel)]="form.meetingId" class="w-full px-3 py-2.5 mb-4">
            <option [ngValue]="null" disabled>Selecione a reunião...</option>
            @for (m of meetings(); track m.id) {
              <option [ngValue]="m.id">{{ m.title }}</option>
            }
          </select>

          <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Responsável</label>
          <select [(ngModel)]="form.assigneeId" class="w-full px-3 py-2.5 mb-4">
            <option [ngValue]="null">Sem responsável</option>
            @for (u of users(); track u.id) {
              <option [ngValue]="u.id">{{ u.name }}</option>
            }
          </select>

          <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Prazo</label>
          <input type="date" [(ngModel)]="form.dueDate" class="w-full px-3 py-2.5 mb-4" />

          <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Status</label>
          <select [(ngModel)]="form.status" class="w-full px-3 py-2.5 mb-6">
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDA">Concluída</option>
          </select>

          <div class="flex gap-3">
            <button (click)="closeModal()" class="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
              Cancelar
            </button>
            <button (click)="submitTask()" [disabled]="saving() || !form.title?.trim() || !form.meetingId"
              class="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold"
              [style.opacity]="saving() || !form.title?.trim() || !form.meetingId ? '0.5' : '1'"
              style="background: var(--color-primary); color: #000; border: none; cursor: pointer">
              {{ saving() ? 'Salvando...' : 'Criar Tarefa' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirm -->
    @if (deleteTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.75)">
        <div class="rounded-2xl w-full max-w-sm mx-4 p-6"
             style="background: var(--color-surface); border: 1px solid var(--color-border)">
          <div class="text-3xl mb-4 text-center">⚠️</div>
          <h3 class="text-lg font-semibold text-center mb-2" style="color: var(--color-text-primary)">Confirmar Exclusão</h3>
          <p class="text-sm text-center mb-6" style="color: var(--color-text-secondary)">
            Excluir <strong style="color: var(--color-text-primary)">{{ deleteTarget()?.title }}</strong>?
          </p>
          <div class="flex gap-3">
            <button (click)="deleteTarget.set(null)" class="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
              Cancelar
            </button>
            <button (click)="executeDelete()" class="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold"
              style="background: var(--color-danger); color: #fff; border: none; cursor: pointer">
              Excluir
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class TarefaList implements OnInit {
  private taskService    = inject(TaskService);
  private userService    = inject(UserService);
  private meetingService = inject(MeetingService);
  private notify         = inject(NotificationService);

  tasks        = signal<Task[]>([]);
  users        = signal<User[]>([]);
  meetings     = signal<Meeting[]>([]);
  loading      = signal(false);
  saving       = signal(false);
  showModal    = signal(false);
  deleteTarget = signal<Task | null>(null);
  filterMeetingId: number | null = null;

  readonly columns = COLUMNS;

  form: { title: string; meetingId: number | null; assigneeId: number | null; dueDate: string; status: TaskStatus } = {
    title: '', meetingId: null, assigneeId: null, dueDate: '', status: 'PENDENTE',
  };

  tasksByStatus(status: TaskStatus): Task[] {
    return this.tasks().filter(t =>
      t.status === status &&
      (this.filterMeetingId == null || t.meeting.id === this.filterMeetingId)
    );
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [tasks, users, meetings] = await Promise.all([
        this.taskService.listar(),
        this.userService.listar().catch(() => []),
        this.meetingService.listar().catch(() => []),
      ]);
      this.tasks.set(tasks);
      this.users.set(users);
      this.meetings.set(meetings);
    } catch {
      this.notify.error('Erro ao carregar tarefas.');
    } finally {
      this.loading.set(false);
    }
  }

  openModal(): void {
    this.form = { title: '', meetingId: this.filterMeetingId, assigneeId: null, dueDate: '', status: 'PENDENTE' };
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  async submitTask(): Promise<void> {
    if (!this.form.title?.trim() || !this.form.meetingId) return;
    this.saving.set(true);
    try {
      const meeting = this.meetings().find(m => m.id === this.form.meetingId);
      const assignee = this.form.assigneeId
        ? this.users().find(u => u.id === this.form.assigneeId)
        : undefined;

      const nova = await this.taskService.criar({
        title:    this.form.title.trim(),
        status:   this.form.status,
        dueDate:  this.form.dueDate || undefined,
        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : undefined,
        meeting:  { id: this.form.meetingId, title: meeting?.title },
      });
      this.tasks.update(list => [...list, nova]);
      this.notify.success('Tarefa criada!');
      this.closeModal();
    } catch {
      this.notify.error('Erro ao criar tarefa.');
    } finally {
      this.saving.set(false);
    }
  }

  async moveTask(t: Task, status: TaskStatus): Promise<void> {
    try {
      await this.taskService.editar(t.id!, { status });
      this.tasks.update(list => list.map(x => x.id === t.id ? { ...x, status } : x));
    } catch {
      this.notify.error('Erro ao mover tarefa.');
    }
  }

  confirmDelete(t: Task): void { this.deleteTarget.set(t); }

  async executeDelete(): Promise<void> {
    const t = this.deleteTarget();
    if (!t?.id) return;
    try {
      await this.taskService.excluir(t.id);
      this.tasks.update(list => list.filter(x => x.id !== t.id));
      this.notify.success('Tarefa excluída.');
      this.deleteTarget.set(null);
    } catch {
      this.notify.error('Erro ao excluir tarefa.');
    }
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
  }

  initials(name: string): string {
    if (!name?.trim()) return '??';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
