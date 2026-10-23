import { Component, inject, signal, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService, MeetingCreateDTO, MeetingUpdateDTO } from '../../../core/services/meeting.service';
import { ParticipantService } from '../../../core/services/participant.service';
import { TopicService } from '../../../core/services/topic.service';
import { MeetingMinutesService } from '../../../core/services/meeting-minutes.service';
import { UserService } from '../../../core/services/user.service';
import { LogService } from '../../../core/services/log.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { Meeting } from '../../../core/models/meeting.model';
import { ParticipantRole } from '../../../core/models/participant.model';
import { TopicPriority } from '../../../core/models/topic.model';
import { User } from '../../../core/models/user.model';
import { DayOfWeek, TimeRange } from '../../../core/models/availability.model';
import { CommonModule } from '@angular/common';

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
  imports: [FormsModule, ToastComponent, CommonModule],
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
    estimatedMeetingDate: '', duration: 60,
    isPresent: true
  };

  formDate = '';
  formTime = '';

  availableTimes: TimeRange[] = [];

  allUsers: User[]           = [];
  participantSearch          = '';
  userSuggestions            = signal<User[]>([]);
  formParticipants: FormParticipant[] = [];
  formTopics: FormTopic[]    = [];

  readonly steps = [
    { i: 1, label: 'Participantes'  },
    { i: 2, label: 'Informações'},
    { i: 3, label: 'Pauta'        },
    { i: 4, label: 'Revisão'      },
  ];

  get reviewRows() {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    let dateLabel = '—';
    if (this.formDate && this.formTime) {
      const d = new Date(`${this.formDate}T${this.formTime}`);
      dateLabel = `${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()} às ${this.formTime}`;
    }
    return [
      { key: 'Título',        value: this.form.title    || '—'                              },
      { key: 'Data / Hora',   value: dateLabel                                              },
      { key: 'Duração',       value: this.form.duration ? `${this.form.duration} min` : '—' },
      { key: 'Local',         value: this.form.location || '—'                              },
      { key: 'Modalidade',    value: this.form.isPresent ? `Presencial` : `Remoto`          },
      { key: 'Participantes', value: `${this.formParticipants.length} convidado(s)`         },
      { key: 'Pautas',        value: `${this.formTopics.length} item(s)`                    },
    ];
  }

  dropdownAberto = false;

  @ViewChild('horarioWrapper') horarioWrapper!: ElementRef<HTMLElement>;

  toggleDropdown() {
    this.dropdownAberto = !this.dropdownAberto;
  }

  // Fecha ao clicar fora
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (
      this.dropdownAberto &&
      !this.horarioWrapper?.nativeElement.contains(event.target as Node)
    ) {
      this.dropdownAberto = false;
    }
  }

  // Fecha com Esc
  @HostListener('document:keydown.escape')
  onEsc() { 
    this.dropdownAberto = false;
  }

  async buscarMelhorHorario(): Promise<void> {
    try {
      if (!this.formDate || !this.formParticipants?.length) {
        this.availableTimes = [];
        this.formTime = '';
        return;
      }
      // Extrai os IDs dos participantes
      const userIds = this.formParticipants.map(p => p.userId);

      // Obtém o dia da semana da data selecionada
      const date = new Date(`${this.formDate}T12:00:00`);

      const days: DayOfWeek[] = [
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY'
      ];

      const dayOfWeek = days[date.getDay()];

      // Busca os horários em comum
      this.availableTimes =
        await this.meetingService.findCommonAvailability(
          userIds,
          dayOfWeek
        );

      if (this.availableTimes.length === 0) {
        this.notify.error('Não há horários em comum entre os participantes no dia selecionado.');
        this.formTime = ''
        return;
      }

      // Busca o melhor horário entre os intervalos disponíveis
      const bestTime =  
        await this.meetingService.findBestAvailability(
          this.availableTimes
        );

      if (!bestTime) {
        this.notify.error('Não foi possível encontrar o melhor horário.');
        return;
      }

      this.formTime = bestTime.start.substring(0, 5);

      // Aqui você pode preencher os campos de horário do formulário.
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      this.notify.error('Erro ao consultar a disponibilidade dos participantes.');
    }
  }

  async aoAlterarData(data: string): Promise<void> {
    this.formDate = data;

    if (!data || !this.formParticipants?.length) {
      return;
    }

    await this.buscarMelhorHorario();
  }

  get horariosDisponiveis(): string[] { 
    const horarios = new Set<string>();
    const duracao = Number(this.form.duration);

    if (!duracao || duracao <= 0) {
      return [];
    }

    for (const intervalo of this.availableTimes) {
      const inicio = this.converterParaMinutos(intervalo.start);
      const fim = this.converterParaMinutos(intervalo.end);

      // O início deve permitir que a reunião termine dentro do intervalo.
      const ultimoInicio = fim - duracao;

      for (
        let minutos = inicio;
        minutos <= ultimoInicio;
        minutos += 15
      ) {
        const hora = String(Math.floor(minutos / 60)).padStart(2, '0');
        const minuto = String(minutos % 60).padStart(2, '0');

        horarios.add(`${hora}:${minuto}`);
      }
    }

    return [...horarios].sort();
  }

  validarHorario(horario: string): void {
    if (!horario) return;

    const minutos = this.converterParaMinutos(horario);

    const disponivel = this.availableTimes.some(intervalo => {
      const inicio = this.converterParaMinutos(intervalo.start);
      const fim = this.converterParaMinutos(intervalo.end);

      return minutos >= inicio && minutos < fim;
    });

    if (!disponivel) {
      this.formTime = '';
      this.notify.error('Selecione um horário dentro da disponibilidade dos participantes.');
    }
  }

  private converterParaMinutos(horario: string): number {
    const [horas, minutos] = horario.split(':').map(Number);
    return horas * 60 + minutos;
  }

  selecionarHorario(horario: string): void {
    this.formTime = horario;
  }

  podeAdicionarPautas(): boolean{
    var soma = 0 ;
    this.formTopics.forEach(t => {soma += t.timer});
    return this.form.duration > soma;
  }

  podeAvancarPautas(): boolean{
    var soma = 0 ;
    this.formTopics.forEach(t => {soma += t.timer});
    return this.form.duration >= soma;
  }

  pautaValida(): boolean {
    return this.formTopics.length > 0 && this.formTopics.every(t => !!t.title?.trim());
  }

  get canAdvance(): boolean {
    if (this.step() === 1) {
      return (this.formParticipants?.length ?? 0) > 0;
    }
    if (this.step() === 2) {
      return !!(
        this.form.title?.trim() &&
        this.formDate &&
        this.formTime &&
        this.form.duration &&
        this.form.location?.trim()
      );
    }
    if (this.step() === 3) {
      return this.pautaValida() && this.podeAvancarPautas();
    }
    return true;
  }

  async ngOnInit(): Promise<void> {
    if (this.auth.temPermissao('ROLE_ADMIN')) {
      this.allUsers = await this.userService.listar().catch(() => []);
    } else if (this.auth.temPermissao('ROLE_ORGANIZADOR')) {
      const participants = await this.participantService.listar().catch(() => []);
      const seen = new Set<number>();
      this.allUsers = participants
        .filter(p => p.user?.id && !seen.has(p.user.id) && seen.add(p.user.id))
        .map(p => ({ id: p.user.id, name: p.user.name ?? '', email: p.user.email ?? '' } as User));
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.editId = Number(id);
      try {
        const m = await this.meetingService.buscar(this.editId);
        this.form = { title: m.title, description: m.description, location: m.location,
                      estimatedMeetingDate: m.estimatedMeetingDate, duration: m.duration, status: m.status, isPresent: m.isPresent };
        if (m.estimatedMeetingDate) {
          const d = new Date(m.estimatedMeetingDate);
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
        if (minutes) {
          this.formTopics = (minutes.topics ?? []).map(t => ({
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

  get tempoTotalPautas(): number {
    return this.formTopics.reduce((soma, t) => soma + (Number(t.timer) || 0), 0);
  }

  get ultimaPautaSemNome(): boolean {
    const ultima = this.formTopics[this.formTopics.length - 1];
    return !!ultima && !ultima.title.trim();
  }

  get bloquearAdicionarPauta(): boolean {
    return this.ultimaPautaSemNome;
  }

  addTopic(): void {
    if (this.bloquearAdicionarPauta) return;
    if (this.podeAdicionarPautas()) {
      this.notify.info('Informe o nome da pauta, caso queira adicionar outra e/ou proseguir no formulário.')
    } else {
      this.notify.warning('O tempo total das pautas ultrapassa a duração prevista da reunião.')
    }

    this.formTopics.push({
      title: '',
      priority: 'MEDIA',
      timer: 15,
      orderIndex: this.formTopics.length + 1,
    });
  }

  removeTopic(i: number): void {
    this.formTopics.splice(i, 1);
    this.formTopics.forEach((t, idx) => t.orderIndex = idx + 1);
  }

  next(): void { if (this.canAdvance) this.step.update(s => s + 1); }
  prev(): void { this.step.update(s => Math.max(1, s - 1)); }
  goBack(): void { this.router.navigate(['/reunioes']); }

  async submit(): Promise<void> {
    this.saving.set(true);
    try {
      const estimatedMeetingDate = `${this.formDate}T${this.formTime}`;

      if (this.isEdit && this.editId) {
        const updateDTO: MeetingUpdateDTO = {
          estimatedMeetingDate,
          title:       this.form.title,
          description: this.form.description,
          location:    this.form.location,
          isPresent:   this.form.isPresent,
          duration:    this.form.duration,
          status:      this.form.status,
        };
        await this.meetingService.editar(this.editId, updateDTO);
        await this.syncParticipants(this.editId);
        await this.syncTopics(this.editId);
        this.logService.registrar(`Reunião editada: ${this.form.title}`, this.auth.getNomeUsuario()).catch(() => {});
        this.notify.success('Reunião atualizada com sucesso!');
      } else {
        const me = await this.userService.buscarMe();
        const createDTO: MeetingCreateDTO = {
          user:        { id: me.id },
          estimatedMeetingDate,
          title:       this.form.title,
          description: this.form.description,
          location:    this.form.location,
          isPresent:   this.form.isPresent,
          duration:    this.form.duration,
        };
        const meeting = await this.meetingService.criar(createDTO);
        await this.syncParticipants(meeting.id!);
        if (this.formTopics.some(t => t.title.trim())) {
          await this.syncTopics(meeting.id!).catch(() => {
            this.notify.warning('As pautas não puderam ser salvas. Adicione-as na tela de detalhes.');
          });
        }
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
        this.participantService.criar({ user: { id: p.userId }, meeting: { id: meetingId }, role: p.role })
      )
    );
  }

  private async syncTopics(meetingId: number): Promise<void> {
    let minutes = await this.minutesService.buscarPorReuniao(meetingId);
    if (!minutes) {
      minutes = await this.minutesService.criar(
        { meeting: { id: meetingId }, objectives: '', notes: '', decision: '' },
        { skipNavigation: true }
      );
    }

    const me = await this.userService.buscarMe();
    const participants = await this.participantService.listarPorReuniao(meetingId);
    let myParticipant = participants.find(p => p.user.id === me.id);
    if (!myParticipant) {
      myParticipant = await this.participantService.criar({
        user:    { id: me.id },
        meeting: { id: meetingId },
        role:    'ORGANIZADOR',
      });
    }

    await Promise.all((minutes.topics ?? []).map(t => this.topicService.excluir(t.id!)));
    await Promise.all(
      this.formTopics
        .filter(t => t.title.trim())
        .map(t => this.topicService.criar({
          meetingMinutes: { id: minutes!.id! },
          participant:    { id: myParticipant!.id! },
          title:          t.title,
          priority:       t.priority,
          timer:          t.timer,
          orderIndex:     t.orderIndex,
          concluded:      false,
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
