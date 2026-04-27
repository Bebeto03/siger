import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService } from '../../../core/services/meeting.service';
import { ParticipantService } from '../../../core/services/participant.service';
import { TopicService } from '../../../core/services/topic.service';
import { MeetingMinutesService } from '../../../core/services/meeting-minutes.service';
import { UserService } from '../../../core/services/user.service';
import { LogService } from '../../../core/services/log.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { Meeting } from '../../../core/models/meeting.model';
import { Participant, ParticipantRole } from '../../../core/models/participant.model';
import { TopicPriority } from '../../../core/models/topic.model';
import { User } from '../../../core/models/user.model';

interface FormParticipant {
  userId: number;
  name: string;
  email: string;
  role: ParticipantRole;
}

interface FormTopic {
  title: string;
  priority: TopicPriority;
  timer: number;
  orderIndex: number;
}

@Component({
  selector: 'app-reuniao-form',
  standalone: true,
  imports: [FormsModule, ToastComponent],
  styles: [`
    .step-line { transition: background 0.3s; }
    .btn-primary:hover { background: var(--color-primary-dark) !important; }
    .btn-secondary:hover { opacity: 0.8; }
    .btn-danger-sm:hover { background: rgba(239,68,68,0.2) !important; }
    .topic-row { transition: background 0.15s; }
    .topic-row:hover { background: var(--color-surface-hover) !important; }
    input, textarea, select {
      background: var(--color-surface-light);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text-primary);
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus, textarea:focus, select:focus { border-color: var(--color-primary); }
    select option { background: var(--color-surface-light); }
  `],
  templateUrl: './reuniao-form.html'
})
export class ReuniaoForm implements OnInit {
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private meetingService      = inject(MeetingService);
  private participantService  = inject(ParticipantService);
  private topicService        = inject(TopicService);
  private minutesService      = inject(MeetingMinutesService);
  private userService         = inject(UserService);
  private logService          = inject(LogService);
  private auth                = inject(AuthService);
  private notify              = inject(NotificationService);

  step    = signal(1);
  saving  = signal(false);
  isEdit  = false;
  editId: number | null = null;

  form: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'> = {
    title: '', description: '', location: '',
    meetingDate: '', duration: 60,
  };

  formDate = '';
  formTime = '';

  allUsers: User[]           = [];
  participantSearch          = '';
  userSuggestions            = signal<User[]>([]);
  formParticipants: FormParticipant[] = [];
  formTopics: FormTopic[]    = [];

  readonly steps = [
    { i: 1, label: 'Informações'  },
    { i: 2, label: 'Participantes'},
    { i: 3, label: 'Pauta'        },
    { i: 4, label: 'Revisão'      },
  ];

  reviewRows = computed(() => {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    let dateLabel = '—';
    if (this.formDate && this.formTime) {
      const d = new Date(`${this.formDate}T${this.formTime}`);
      dateLabel = `${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()} às ${this.formTime}`;
    }
    return [
      { key: 'Título',        value: this.form.title    || '—'                              },
      { key: 'Data / Hora',   value: dateLabel                                              },
      { key: 'Duração',       value: this.form.duration ? `${this.form.duration} min` : '—'},
      { key: 'Local',         value: this.form.location || '—'                              },
      { key: 'Participantes', value: `${this.formParticipants.length} convidado(s)`         },
      { key: 'Pautas',        value: `${this.formTopics.length} item(s)`                   },
    ];
  });

  canAdvance = computed(() => {
    if (this.step() === 1)
      return !!(this.form.title?.trim() && this.formDate && this.formTime && this.form.duration && this.form.location?.trim());
    return true;
  });

  async ngOnInit(): Promise<void> {
    this.allUsers = await this.userService.listar().catch(() => []);

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.editId = Number(id);
      try {
        const m = await this.meetingService.buscar(this.editId);
        this.form = { title: m.title, description: m.description, location: m.location,
                      meetingDate: m.meetingDate, duration: m.duration, status: m.status, organizer: m.organizer };
        if (m.meetingDate) {
          const d = new Date(m.meetingDate);
          this.formDate = d.toISOString().substring(0, 10);
          this.formTime = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        }
        const participants = await this.participantService.listarPorReuniao(this.editId);
        this.formParticipants = participants.map(p => ({
          userId: p.user.id,
          name:   p.user.name  ?? '',
          email:  p.user.email ?? '',
          role:   p.role,
        }));
        const minutes = await this.minutesService.buscarPorReuniao(this.editId);
        if (minutes?.id) {
          const topics = await this.topicService.listarPorAta(minutes.id);
          this.formTopics = topics.map(t => ({
            title:      t.title,
            priority:   t.priority,
            timer:      t.timer ?? 15,
            orderIndex: t.orderIndex,
          }));
        }
      } catch {
        this.notify.error('Erro ao carregar reunião.');
        this.router.navigate(['/reunioes']);
      }
    }
  }

  filterUsers(): void {
    const q = this.participantSearch.toLowerCase().trim();
    if (!q) { this.userSuggestions.set([]); return; }
    const already = new Set(this.formParticipants.map(p => p.userId));
    this.userSuggestions.set(
      this.allUsers.filter(u =>
        !already.has(u.id) &&
        (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      ).slice(0, 5)
    );
  }

  addParticipant(u: User): void {
    this.formParticipants.push({ userId: u.id, name: u.name, email: u.email, role: 'PARTICIPANTE' });
    this.participantSearch = '';
    this.userSuggestions.set([]);
  }

  removeParticipant(p: FormParticipant): void {
    this.formParticipants = this.formParticipants.filter(x => x.userId !== p.userId);
  }

  addTopic(): void {
    this.formTopics.push({ title: '', priority: 'MEDIA', timer: 15, orderIndex: this.formTopics.length + 1 });
  }

  removeTopic(i: number): void {
    this.formTopics.splice(i, 1);
    this.formTopics.forEach((t, idx) => t.orderIndex = idx + 1);
  }

  next(): void { if (this.canAdvance()) this.step.update(s => s + 1); }
  prev(): void { this.step.update(s => Math.max(1, s - 1)); }
  goBack(): void { this.router.navigate(['/reunioes']); }

  async submit(): Promise<void> {
    this.saving.set(true);
    try {
      const payload = { ...this.form, meetingDate: `${this.formDate}T${this.formTime}:00` };

      if (this.isEdit && this.editId) {
        await this.meetingService.editar(this.editId, payload);
        await this.syncParticipants(this.editId);
        await this.syncTopics(this.editId);
        this.logService.registrar(`Reunião editada: ${this.form.title}`, this.auth.getNomeUsuario()).catch(() => {});
        this.notify.success('Reunião atualizada com sucesso!');
      } else {
        const meeting = await this.meetingService.criar(payload);
        await this.syncParticipants(meeting.id!);
        await this.syncTopics(meeting.id!);
        this.logService.registrar(`Reunião criada: ${this.form.title}`, this.auth.getNomeUsuario()).catch(() => {});
        this.notify.success('Reunião criada com sucesso!');
      }
      this.router.navigate(['/reunioes']);
    } catch {
      this.notify.error('Erro ao salvar reunião.');
    } finally {
      this.saving.set(false);
    }
  }

  private async syncParticipants(meetingId: number): Promise<void> {
    const existing = await this.participantService.listarPorReuniao(meetingId);
    await Promise.all(existing.map(p => this.participantService.excluir(p.id!)));
    await Promise.all(
      this.formParticipants.map(p =>
        this.participantService.criar({ role: p.role, user: { id: p.userId }, meeting: { id: meetingId } })
      )
    );
  }

  private async syncTopics(meetingId: number): Promise<void> {
    let minutes = await this.minutesService.buscarPorReuniao(meetingId);
    if (!minutes) {
      minutes = await this.minutesService.criar({ objectives: '', notes: '', decision: '', meeting: { id: meetingId } });
    }
    const existing = await this.topicService.listarPorAta(minutes.id!);
    await Promise.all(existing.map(t => this.topicService.excluir(t.id!)));
    await Promise.all(
      this.formTopics
        .filter(t => t.title.trim())
        .map(t => this.topicService.criar({
          title:         t.title,
          priority:      t.priority,
          timer:         t.timer,
          orderIndex:    t.orderIndex,
          concluded:     false,
          meetingMinutes: { id: minutes!.id! },
        }))
    );
  }

  initials(name: string): string {
    if (!name?.trim()) return '??';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
