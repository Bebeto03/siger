import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';
import { MeetingService } from '../../../core/services/meeting.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';
import { Meeting } from '../../../core/models/meeting.model';
import { Participant } from '../../../core/models/participant.model';
import { ParticipantService } from '../../../core/services/participant.service';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'NAO_INICIADO', label: 'Pendente',     color: 'var(--color-text-muted)' },
  { status: 'EM_ANDAMENTO', label: 'Em Andamento', color: 'var(--color-warning)'    },
  { status: 'CONCLUIDO',    label: 'Concluída',    color: 'var(--color-success)'    },
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
  private participantService = inject(ParticipantService);
  private auth           = inject(AuthService);
  private notify         = inject(NotificationService);

  tasks        = signal<Task[]>([]);
  users        = signal<User[]>([]);
  meetings     = signal<Meeting[]>([]);
  participants = signal<Participant[]>([]);
  loading      = signal(false);
  saving       = signal(false);
  showModal    = signal(false);
  editTarget   = signal(false);
  deleteTarget = signal<Task | null>(null);
  filterMeetingId: number | null = null;
  hasAccess = this.auth.temPermissao('ROLE_ADMIN') || this.auth.temPermissao('ROLE_ORGANIZADOR');
  editingTask: Task | null = null;

  readonly columns = COLUMNS;

  form: { title: string; meetingId: number | null; assigneeId: number | null; dueDate: string; status: TaskStatus } = {
    title: '', meetingId: null, assigneeId: null, dueDate: '', status: 'NAO_INICIADO',
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
      const usersPromise = this.auth.temPermissao('ROLE_ADMIN')
        ? this.userService.listar().catch(() => [] as User[])
        : Promise.resolve([] as User[]);
      const [users, meetings] = await Promise.all([
        usersPromise,
        this.meetingService.listarMinhasReunioes().catch(() => []),
      ]);
      const tasks = (
        await Promise.all(
          meetings
            .filter((meeting) => meeting.id !== undefined)
            .map((meeting) =>
              this.taskService
                .listarPorReuniao(meeting.id!)
                .catch(() => [])
            )
        )
      ).flat();
      this.tasks.set(tasks);
      this.users.set(users);
      this.meetings.set(meetings);
    } catch {
      this.notify.error('Erro ao carregar tarefas.');
    } finally {
      this.loading.set(false);
    }
  }

  openModal(t?:Task): void {
    this.editingTask = t ?? null;

    this.form = t ? { title: t.title, meetingId: t.meeting.id, assigneeId: t.assignee?.id! ?? null, dueDate: t.dueDate ? t.dueDate.substring(0, 10) : '', status: t.status } 
                  :{ title: '', meetingId: this.filterMeetingId, assigneeId: null, dueDate: '', status: 'NAO_INICIADO' };
    this.showModal.set(true);
    if (t) {
      void this.onMeetingChange(t.meeting.id, t.assignee?.id);
      this.editTarget.set(true);
    }else if (this.filterMeetingId) {
      void this.onMeetingChange(this.filterMeetingId)
    }
  }

  closeModal(): void { this.showModal.set(false);  this.editTarget.set(false);}

  async submitTask(): Promise<void> {
    if (!this.form.title?.trim() || this.form.meetingId == null) {
      return;
    }

    this.saving.set(true);

    try {
      const data = {
        title: this.form.title.trim(),
        status: this.form.status ?? 'NAO_INICIADO',
        meetingId: this.form.meetingId,
        assigneeId: this.form.assigneeId ?? undefined,
        description: '',
        dueDate: this.form.dueDate
                ? `${this.form.dueDate}T00:00:00`
                : undefined,
      };
      if (this.editingTask) {
        const atualizada = await this.taskService.editarEntity(
          this.editingTask.id!,
          data
        );

        this.tasks.update(list =>
          list.map(task =>
            task.id === atualizada.id ? atualizada : task
          )
        );

        this.notify.success('Tarefa atualizada!');
      } else {
        const nova = await this.taskService.criar(data);

        this.tasks.update(list => [...list, nova]);

        this.notify.success('Tarefa criada!');
      }

      this.closeModal();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      this.notify.error('Erro ao salvar tarefa.');
    } finally {
      this.saving.set(false);
    }
  }

  async moveTask(t: Task, status: TaskStatus): Promise<void> {
    try {
      await this.taskService.editarStatus(t.id!, status );
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

  async onMeetingChange(meetingId: number | null ,assigneeId?: number | null): Promise<void> {
    this.participants.set([]);
    this.form.assigneeId = null;

    if (meetingId == null) return;

    try {
      const result = await this.participantService.listarPorReuniao(meetingId);

      this.participants.set(result);

      const participantExists = result.some(
        p => p.user.id === assigneeId
      );

      this.form.assigneeId = participantExists
        ? assigneeId!
        : null;

    } catch (error) {
      console.error('Erro ao buscar participantes:', error);
    }
  }
}
