import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService } from '../../../core/services/meeting.service';
import { ParticipantService } from '../../../core/services/participant.service';
import { TopicService } from '../../../core/services/topic.service';
import { MeetingMinutesService } from '../../../core/services/meeting-minutes.service';
import { LogService } from '../../../core/services/log.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { Meeting, MeetingStatus } from '../../../core/models/meeting.model';
import { Participant, ParticipantParticipation } from '../../../core/models/participant.model';
import { Topic, TopicPriority } from '../../../core/models/topic.model';
import { MeetingMinutes } from '../../../core/models/meeting-minutes.model';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

type ActiveTab = 'info' | 'participants' | 'topics' | 'minutes' | 'tasks';

@Component({
  selector: 'app-reuniao-detalhe',
  standalone: true,
  imports: [FormsModule, ToastComponent],
  styles: [`
    .tab-btn { transition: color 0.15s, border-color 0.15s; }
    .participant-row { transition: background 0.15s; }
    .participant-row:hover { background: var(--color-surface-hover) !important; }
    .topic-row { transition: border-color 0.15s; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.8s linear infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .timer-pulse { animation: pulse 1s ease-in-out infinite; }
  `],
  templateUrl: './reuniao-detalhe.html'
})
export class ReuniaoDetalhe implements OnInit, OnDestroy {
  private route              = inject(ActivatedRoute);
  private router             = inject(Router);
  private meetingService     = inject(MeetingService);
  private participantService = inject(ParticipantService);
  private topicService       = inject(TopicService);
  private minutesService     = inject(MeetingMinutesService);
  private taskService        = inject(TaskService);
  private userService        = inject(UserService);
  private logService         = inject(LogService);
  private auth               = inject(AuthService);
  private notify             = inject(NotificationService);

  meeting             = signal<Meeting | null>(null);
  participants        = signal<Participant[]>([]);
  topics              = signal<Topic[]>([]);
  minutes             = signal<MeetingMinutes | null>(null);

  loading             = signal(false);
  loadingParticipants = signal(false);
  loadingTopics       = signal(false);
  loadingMinutes      = signal(false);
  savingMinutes       = signal(false);
  showDeleteModal     = signal(false);

  activeTab = signal<ActiveTab>('info');

  minutesForm = { objectives: '', notes: '', decision: '' };
  minutesHistory = signal<{ author: string; date: string }[]>([]);

  tasks        = signal<Task[]>([]);
  allUsers     = signal<User[]>([]);
  loadingTasks = signal(false);
  savingTask   = signal(false);
  showTaskModal = signal(false);
  taskForm: { title: string; assigneeId: number | null; dueDate: string } = { title: '', assigneeId: null, dueDate: '' };

  activeTimer = signal<{ topicId: number; remaining: number } | null>(null);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  readonly tabs = [
    { id: 'info'         as ActiveTab, label: 'Detalhes'     },
    { id: 'participants' as ActiveTab, label: 'Participantes' },
    { id: 'topics'       as ActiveTab, label: 'Pautas'        },
    { id: 'minutes'      as ActiveTab, label: 'Ata'           },
    { id: 'tasks'        as ActiveTab, label: 'Tarefas'       },
  ];

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    try {
      const m = await this.meetingService.buscar(id);
      this.meeting.set(m);
    } catch {
      this.notify.error('Reunião não encontrada.');
      this.router.navigate(['/reunioes']);
      return;
    } finally {
      this.loading.set(false);
    }
    this.loadParticipants(id);
    this.loadMinutesAndTopics(id);
    this.loadTasks(id);
    this.userService.listar().then(u => this.allUsers.set(u)).catch(() => {});
  }

  ngOnDestroy(): void { this.stopTimer(); }

  private async loadParticipants(meetingId: number): Promise<void> {
    this.loadingParticipants.set(true);
    try {
      this.participants.set(await this.participantService.listarPorReuniao(meetingId));
    } catch {
      this.notify.error('Erro ao carregar participantes.');
    } finally {
      this.loadingParticipants.set(false);
    }
  }

  private async loadMinutesAndTopics(meetingId: number): Promise<void> {
    this.loadingMinutes.set(true);
    this.loadingTopics.set(true);
    try {
      const min = await this.minutesService.buscarPorReuniao(meetingId);
      this.minutes.set(min);
      if (min) {
        this.minutesForm = { objectives: min.objectives, notes: min.notes, decision: min.decision };
        const t = await this.topicService.listarPorAta(min.id!);
        this.topics.set(t.sort((a, b) => a.orderIndex - b.orderIndex));
      }
    } catch {
      this.notify.error('Erro ao carregar ata e pautas.');
    } finally {
      this.loadingMinutes.set(false);
      this.loadingTopics.set(false);
    }
  }

  confirmedCount(): number {
    return this.participants().filter(p => p.participation === 'SIM' || p.participation === 'PARTICIPOU').length;
  }

  concludedCount(): number {
    return this.topics().filter(t => t.concluded).length;
  }

  goBack(): void { this.router.navigate(['/reunioes']); }
  goEdit(): void { this.router.navigate(['/reunioes', this.meeting()?.id, 'editar']); }

  async executeDelete(): Promise<void> {
    const id = this.meeting()?.id;
    if (!id) return;
    try {
      await this.meetingService.excluir(id);
      this.logService.registrar(`Reunião excluída: ${this.meeting()?.title}`, this.auth.getNomeUsuario()).catch(() => {});
      this.notify.success('Reunião excluída.');
      this.router.navigate(['/reunioes']);
    } catch {
      this.notify.error('Erro ao excluir reunião.');
      this.showDeleteModal.set(false);
    }
  }

  async toggleTopic(t: Topic): Promise<void> {
    const updated = { ...t, concluded: !t.concluded };
    try {
      await this.topicService.editar(t.id!, { concluded: updated.concluded });
      this.topics.update(list => list.map(x => x.id === t.id ? updated : x));
    } catch {
      this.notify.error('Erro ao atualizar pauta.');
    }
  }

  async saveMinutes(): Promise<void> {
    const meetingId = this.meeting()?.id;
    if (!meetingId) return;
    this.savingMinutes.set(true);
    try {
      const payload = { ...this.minutesForm, meeting: { id: meetingId } };
      if (this.minutes()?.id) {
        await this.minutesService.editar(this.minutes()!.id!, payload);
      } else {
        const created = await this.minutesService.criar(payload);
        this.minutes.set(created);
      }
      const now   = new Date();
      const label = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
      this.minutesHistory.update(h => [{ author: this.auth.getNomeUsuario() || 'Você', date: label }, ...h]);
      this.notify.success('Ata salva com sucesso!');
    } catch {
      this.notify.error('Erro ao salvar ata.');
    } finally {
      this.savingMinutes.set(false);
    }
  }

  private async loadTasks(meetingId: number): Promise<void> {
    this.loadingTasks.set(true);
    try {
      this.tasks.set(await this.taskService.listarPorReuniao(meetingId));
    } catch {
      this.notify.error('Erro ao carregar tarefas.');
    } finally {
      this.loadingTasks.set(false);
    }
  }

  openTaskModal(): void {
    this.taskForm = { title: '', assigneeId: null, dueDate: '' };
    this.showTaskModal.set(true);
  }

  async submitTask(): Promise<void> {
    if (!this.taskForm.title?.trim()) return;
    this.savingTask.set(true);
    try {
      const meetingId = this.meeting()!.id!;
      const assignee  = this.taskForm.assigneeId
        ? this.allUsers().find(u => u.id === this.taskForm.assigneeId)
        : undefined;
      const nova = await this.taskService.criar({
        title:    this.taskForm.title.trim(),
        status:   'NAO_INICIADO',
        dueDate:  this.taskForm.dueDate || undefined,
        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : undefined,
        meeting:  { id: meetingId, title: this.meeting()!.title },
      });
      this.tasks.update(list => [...list, nova]);
      this.showTaskModal.set(false);
      this.notify.success('Tarefa criada!');
    } catch {
      this.notify.error('Erro ao criar tarefa.');
    } finally {
      this.savingTask.set(false);
    }
  }

  taskStatusLabel(s: TaskStatus): string {
    const m: Record<TaskStatus, string> = { NAO_INICIADO: 'Pendente', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluída' };
    return m[s] ?? s;
  }

  taskStatusColor(s: TaskStatus): string {
    const m: Record<TaskStatus, string> = { NAO_INICIADO: 'var(--color-text-muted)', EM_ANDAMENTO: 'var(--color-warning)', CONCLUIDO: 'var(--color-success)' };
    return m[s] ?? 'var(--color-text-secondary)';
  }

  taskStatusBg(s: TaskStatus): string {
    const m: Record<TaskStatus, string> = { NAO_INICIADO: 'rgba(148,163,184,0.1)', EM_ANDAMENTO: 'rgba(245,158,11,0.15)', CONCLUIDO: 'rgba(16,185,129,0.15)' };
    return m[s] ?? 'rgba(148,163,184,0.1)';
  }

  formatShortDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
  }

  onComingSoon(feature: string): void {
    this.notify.info(`${feature} estará disponível em breve.`);
  }

  // ── Timer ───────────────────────────────────────────────────────────────────

  startTimer(t: Topic): void {
    if (t.concluded) return;
    this.stopTimer();
    const minutes = t.timer ?? 5;
    this.activeTimer.set({ topicId: t.id!, remaining: minutes * 60 });
    this.timerInterval = setInterval(() => {
      const current = this.activeTimer();
      if (!current) return;
      if (current.remaining <= 0) {
        this.notify.info(`Tempo da pauta "${t.title}" encerrado!`);
        this.stopTimer();
        return;
      }
      this.activeTimer.set({ ...current, remaining: current.remaining - 1 });
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.activeTimer.set(null);
  }

  formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  formatDate(dateStr: string): string {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2,'0')} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }

  initials(name: string): string {
    if (!name?.trim()) return '??';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  statusLabel(s: MeetingStatus): string {
    const m: Record<MeetingStatus, string> = { NAO_INICIADO: 'Não iniciada', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluída', CANCELADO: 'Cancelada' };
    return m[s] ?? s;
  }

  statusColor(s: MeetingStatus): string {
    const m: Record<MeetingStatus, string> = { NAO_INICIADO: 'var(--color-primary)', EM_ANDAMENTO: 'var(--color-warning)', CONCLUIDO: 'var(--color-success)', CANCELADO: 'var(--color-danger)' };
    return m[s] ?? 'var(--color-text-secondary)';
  }

  statusBg(s: MeetingStatus): string {
    const m: Record<MeetingStatus, string> = { NAO_INICIADO: 'rgba(6,182,212,0.15)', EM_ANDAMENTO: 'rgba(245,158,11,0.15)', CONCLUIDO: 'rgba(16,185,129,0.15)', CANCELADO: 'rgba(239,68,68,0.15)' };
    return m[s] ?? 'rgba(148,163,184,0.1)';
  }

  roleLabel(r: string): string {
    const m: Record<string, string> = { ORGANIZADOR: 'Organizador', PARTICIPANTE: 'Participante', PALESTRANTE: 'Palestrante' };
    return m[r] ?? r;
  }

  participationLabel(p?: ParticipantParticipation): string {
    const m: Record<string, string> = { SIM: 'Confirmado', NAO: 'Recusado', TALVEZ: 'Talvez', PARTICIPOU: 'Participou', NAO_PARTICIPOU: 'Não participou' };
    return p ? (m[p] ?? p) : 'Pendente';
  }

  participationColor(p?: ParticipantParticipation): string {
    const m: Record<string, string> = { SIM: 'var(--color-success)', PARTICIPOU: 'var(--color-success)', NAO: 'var(--color-danger)', NAO_PARTICIPOU: 'var(--color-danger)', TALVEZ: 'var(--color-warning)' };
    return p ? (m[p] ?? 'var(--color-text-muted)') : 'var(--color-text-muted)';
  }

  participationBg(p?: ParticipantParticipation): string {
    const m: Record<string, string> = { SIM: 'rgba(16,185,129,0.15)', PARTICIPOU: 'rgba(16,185,129,0.15)', NAO: 'rgba(239,68,68,0.15)', NAO_PARTICIPOU: 'rgba(239,68,68,0.15)', TALVEZ: 'rgba(245,158,11,0.15)' };
    return p ? (m[p] ?? 'rgba(148,163,184,0.1)') : 'rgba(148,163,184,0.1)';
  }

  priorityColor(p: TopicPriority): string {
    const m: Record<TopicPriority, string> = { ALTA: 'var(--color-danger)', MEDIA: 'var(--color-warning)', BAIXA: 'var(--color-success)' };
    return m[p] ?? 'var(--color-text-secondary)';
  }

  priorityBg(p: TopicPriority): string {
    const m: Record<TopicPriority, string> = { ALTA: 'rgba(239,68,68,0.15)', MEDIA: 'rgba(245,158,11,0.15)', BAIXA: 'rgba(16,185,129,0.15)' };
    return m[p] ?? 'rgba(148,163,184,0.1)';
  }

  private readonly gradients = [
    'linear-gradient(135deg, #6366F1, #8B5CF6)',
    'linear-gradient(135deg, #EC4899, #F43F5E)',
    'linear-gradient(135deg, #F59E0B, #D97706)',
    'linear-gradient(135deg, #10B981, #059669)',
    'linear-gradient(135deg, #EF4444, #DC2626)',
    'linear-gradient(135deg, #06B6D4, #0891B2)',
  ];

  avatarGradient(i: number): string { return this.gradients[i % this.gradients.length]; }
}
