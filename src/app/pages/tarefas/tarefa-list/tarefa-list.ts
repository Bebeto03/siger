import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';
import { MeetingService } from '../../../core/services/meeting.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';
import { Meeting } from '../../../core/models/meeting.model';

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
  templateUrl: './tarefa-list.html'
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
