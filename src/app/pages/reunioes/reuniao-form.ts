import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService, Meeting, MeetingParticipant, MeetingTopic } from '../../core/services/meeting.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';

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
  template: `
    <div class="flex flex-col min-h-full">
      <app-toast />

      <!-- Top Bar -->
      <div class="flex items-center justify-between px-7 py-5 border-b" style="background: var(--color-surface); border-color: var(--color-border)">
        <div>
          <h1 class="text-xl font-bold" style="color: var(--color-text-primary)">
            {{ isEdit ? 'Editar Reunião' : 'Nova Reunião' }}
          </h1>
          <p class="text-sm mt-0.5" style="color: var(--color-text-muted)">Preencha os dados para {{ isEdit ? 'atualizar' : 'criar' }} a reunião</p>
        </div>
        <button (click)="goBack()" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style="background: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
          ← Voltar
        </button>
      </div>

      <div class="p-7 max-w-2xl mx-auto w-full">

        <!-- Steps indicator -->
        <div class="flex gap-1 mb-8">
          @for (s of steps; track s.i) {
            <div class="flex-1 flex flex-col items-center gap-2">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                   [style.background]="step() > s.i ? 'var(--color-success)' : step() === s.i ? 'var(--color-primary)' : 'var(--color-surface-light)'"
                   [style.color]="step() >= s.i ? '#fff' : 'var(--color-text-muted)'">
                {{ step() > s.i ? '✓' : s.i }}
              </div>
              <span class="text-xs font-medium"
                    [style.color]="step() === s.i ? 'var(--color-text-primary)' : 'var(--color-text-muted)'">
                {{ s.label }}
              </span>
              <div class="step-line w-full h-0.5 rounded"
                   [style.background]="step() > s.i ? 'var(--color-primary)' : 'var(--color-surface-light)'"></div>
            </div>
          }
        </div>

        <!-- Card -->
        <div class="rounded-xl p-6" style="background: var(--color-surface); border: 1px solid var(--color-border)">

          <!-- Step 1: Informações -->
          @if (step() === 1) {
            <h3 class="text-base font-bold mb-5" style="color: var(--color-text-primary)">Informações da Reunião</h3>

            <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Título</label>
            <input [(ngModel)]="form.title" placeholder="Ex: Sprint Planning S4"
              class="w-full px-3 py-2.5 mb-4" />

            <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Descrição</label>
            <textarea [(ngModel)]="form.description" rows="3" placeholder="Descreva o objetivo da reunião..."
              class="w-full px-3 py-2.5 mb-4 resize-y"></textarea>

            <div class="flex gap-4">
              <div class="flex-1">
                <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Data</label>
                <input type="date" [(ngModel)]="formDate" class="w-full px-3 py-2.5 mb-4" />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Horário</label>
                <input type="time" [(ngModel)]="formTime" class="w-full px-3 py-2.5 mb-4" />
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex-1">
                <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Duração (min)</label>
                <input type="number" [(ngModel)]="form.duration" placeholder="60" min="1" class="w-full px-3 py-2.5 mb-4" />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Local</label>
                <input [(ngModel)]="form.location" placeholder="Sala ou link da reunião" class="w-full px-3 py-2.5 mb-4" />
              </div>
            </div>
          }

          <!-- Step 2: Participantes -->
          @if (step() === 2) {
            <h3 class="text-base font-bold mb-5" style="color: var(--color-text-primary)">Participantes</h3>

            <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Buscar usuários</label>
            <input [(ngModel)]="participantSearch" (input)="filterUsers()"
              placeholder="Nome ou e-mail do participante..."
              class="w-full px-3 py-2.5 mb-3" />

            <!-- Suggestions -->
            @if (userSuggestions().length > 0 && participantSearch) {
              <div class="rounded-lg mb-4 overflow-hidden" style="border: 1px solid var(--color-border)">
                @for (u of userSuggestions(); track u.id) {
                  <div (click)="addParticipant(u)"
                       class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                       style="background: var(--color-surface-light)"
                       onmouseenter="this.style.background='var(--color-surface-hover)'"
                       onmouseleave="this.style.background='var(--color-surface-light)'">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                         style="background: linear-gradient(135deg, #6366F1, #8B5CF6)">
                      {{ initials(u.name) }}
                    </div>
                    <div>
                      <div class="text-sm font-medium" style="color: var(--color-text-primary)">{{ u.name }}</div>
                      <div class="text-xs" style="color: var(--color-text-muted)">{{ u.email }}</div>
                    </div>
                    <span class="ml-auto text-xs" style="color: var(--color-primary)">+ Adicionar</span>
                  </div>
                }
              </div>
            }

            <!-- Added participants -->
            @if (form.participants.length > 0) {
              <div class="flex flex-wrap gap-2 mb-4">
                @for (p of form.participants; track p.email) {
                  <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                        style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-primary)">
                    <span class="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold"
                          style="background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); font-size: 9px">
                      {{ initials(p.name) }}
                    </span>
                    {{ p.name }}
                    <select [(ngModel)]="p.role" class="border-0 bg-transparent text-xs py-0 px-1" style="color: var(--color-text-muted); background: transparent">
                      <option value="PARTICIPANTE">Participante</option>
                      <option value="ORGANIZADOR">Organizador</option>
                      <option value="PALESTRANTE">Palestrante</option>
                    </select>
                    <button (click)="removeParticipant(p)" style="background: none; border: none; cursor: pointer; color: var(--color-text-muted)">✕</button>
                  </span>
                }
              </div>
            } @else {
              <div class="text-center py-8 rounded-lg mb-4" style="border: 1px dashed var(--color-border)">
                <p class="text-sm" style="color: var(--color-text-muted)">Nenhum participante adicionado ainda.</p>
              </div>
            }
          }

          <!-- Step 3: Pautas -->
          @if (step() === 3) {
            <h3 class="text-base font-bold mb-5" style="color: var(--color-text-primary)">Pautas da Reunião</h3>

            <div class="flex flex-col gap-2 mb-4">
              @for (t of form.topics; track $index; let i = $index) {
                <div class="topic-row flex items-center gap-3 p-3 rounded-lg"
                     style="background: var(--color-surface-light); border: 1px solid var(--color-border)">
                  <div class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0"
                       style="background: var(--color-surface-hover); color: var(--color-text-muted)">
                    {{ i + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <input [(ngModel)]="t.title" placeholder="Título da pauta"
                      class="w-full px-2 py-1 text-sm border-0 bg-transparent"
                      style="background: transparent; border: none; color: var(--color-text-primary)" />
                  </div>
                  <select [(ngModel)]="t.priority" class="px-2 py-1 text-xs rounded-lg"
                    style="background: var(--color-surface-hover); border: 1px solid var(--color-border); color: var(--color-text-secondary)">
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Média</option>
                    <option value="BAIXA">Baixa</option>
                  </select>
                  <div class="flex items-center gap-1">
                    <input type="number" [(ngModel)]="t.timer" min="1" placeholder="min"
                      class="w-14 px-2 py-1 text-xs text-center"
                      style="background: var(--color-surface-hover); border: 1px solid var(--color-border); color: var(--color-text-secondary)" />
                    <span class="text-xs" style="color: var(--color-text-muted)">min</span>
                  </div>
                  <button (click)="removeTopic(i)" class="btn-danger-sm px-2 py-1 rounded text-xs"
                    style="background: rgba(239,68,68,0.1); color: var(--color-danger); border: 1px solid rgba(239,68,68,0.2); cursor: pointer">
                    🗑
                  </button>
                </div>
              } @empty {
                <div class="text-center py-8 rounded-lg" style="border: 1px dashed var(--color-border)">
                  <p class="text-sm" style="color: var(--color-text-muted)">Nenhuma pauta adicionada ainda.</p>
                </div>
              }
            </div>

            <button (click)="addTopic()" class="w-full py-2.5 rounded-lg text-sm font-semibold"
              style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
              + Adicionar Pauta
            </button>
          }

          <!-- Step 4: Revisão -->
          @if (step() === 4) {
            <h3 class="text-base font-bold mb-5" style="color: var(--color-text-primary)">Revisão</h3>
            <div class="flex flex-col gap-4">
              @for (row of reviewRows(); track row.key) {
                <div class="flex justify-between items-center py-2.5 border-b" style="border-color: var(--color-border)">
                  <span class="text-sm" style="color: var(--color-text-muted)">{{ row.key }}</span>
                  <span class="text-sm font-semibold" style="color: var(--color-text-primary)">{{ row.value }}</span>
                </div>
              }
            </div>
            <div class="mt-5 p-4 rounded-xl flex items-center gap-3"
                 style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25)">
              <span class="text-xl">✅</span>
              <span class="text-sm font-semibold" style="color: var(--color-success)">Tudo certo! Clique em "{{ isEdit ? 'Salvar' : 'Criar Reunião' }}" para confirmar.</span>
            </div>
          }

          <!-- Navigation -->
          <div class="flex justify-between mt-8 pt-5 border-t" style="border-color: var(--color-border)">
            <button (click)="prev()" [style.visibility]="step() === 1 ? 'hidden' : 'visible'"
              class="px-5 py-2.5 rounded-lg text-sm font-medium"
              style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
              ← Anterior
            </button>
            @if (step() < 4) {
              <button (click)="next()" [disabled]="!canAdvance()"
                class="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold"
                [style.opacity]="canAdvance() ? '1' : '0.5'"
                style="background: var(--color-primary); color: #000; border: none; cursor: pointer">
                Próximo →
              </button>
            } @else {
              <button (click)="submit()" [disabled]="saving()"
                class="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                [style.opacity]="saving() ? '0.7' : '1'"
                style="background: var(--color-primary); color: #000; border: none; cursor: pointer">
                {{ saving() ? 'Salvando...' : (isEdit ? '💾 Salvar' : '🚀 Criar Reunião') }}
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReuniaoForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private meetingService = inject(MeetingService);
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  step = signal(1);
  saving = signal(false);
  isEdit = false;
  editId: number | null = null;

  form: Meeting = {
    title: '', description: '', location: '',
    meetingDate: '', duration: 60,
    participants: [], topics: [],
  };

  formDate = '';
  formTime = '';

  allUsers: any[] = [];
  participantSearch = '';
  userSuggestions = signal<any[]>([]);

  readonly steps = [
    { i: 1, label: 'Informações' },
    { i: 2, label: 'Participantes' },
    { i: 3, label: 'Pauta' },
    { i: 4, label: 'Revisão' },
  ];

  reviewRows = computed(() => {
    const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    let dateLabel = '—';
    if (this.formDate && this.formTime) {
      const d = new Date(`${this.formDate}T${this.formTime}`);
      dateLabel = `${d.getDate().toString().padStart(2,'0')} ${monthNames[d.getMonth()]} ${d.getFullYear()} às ${this.formTime}`;
    }
    return [
      { key: 'Título',        value: this.form.title       || '—' },
      { key: 'Data / Hora',   value: dateLabel },
      { key: 'Duração',       value: this.form.duration ? `${this.form.duration} minutos` : '—' },
      { key: 'Local',         value: this.form.location    || '—' },
      { key: 'Participantes', value: `${this.form.participants.length} convidado(s)` },
      { key: 'Pautas',        value: `${this.form.topics.length} item(s)` },
    ];
  });

  canAdvance = computed(() => {
    if (this.step() === 1) return !!(this.form.title?.trim() && this.formDate && this.formTime && this.form.duration && this.form.location?.trim());
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
        this.form = { ...m };
        if (m.meetingDate) {
          const d = new Date(m.meetingDate);
          this.formDate = d.toISOString().substring(0, 10);
          this.formTime = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
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
    const already = new Set(this.form.participants.map(p => p.email));
    this.userSuggestions.set(
      this.allUsers.filter(u =>
        !already.has(u.email) &&
        (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      ).slice(0, 5)
    );
  }

  addParticipant(u: any): void {
    this.form.participants.push({ name: u.name, email: u.email, role: 'PARTICIPANTE', status: null });
    this.participantSearch = '';
    this.userSuggestions.set([]);
  }

  removeParticipant(p: MeetingParticipant): void {
    this.form.participants = this.form.participants.filter(x => x.email !== p.email);
  }

  addTopic(): void {
    this.form.topics.push({
      title: '', priority: 'MEDIA', timer: 15,
      orderIndex: this.form.topics.length + 1, concluded: false,
    });
  }

  removeTopic(i: number): void {
    this.form.topics.splice(i, 1);
    this.form.topics.forEach((t, idx) => t.orderIndex = idx + 1);
  }

  next(): void { if (this.canAdvance()) this.step.update(s => s + 1); }
  prev(): void { this.step.update(s => Math.max(1, s - 1)); }
  goBack(): void { this.router.navigate(['/reunioes']); }

  async submit(): Promise<void> {
    this.saving.set(true);
    try {
      const payload = {
        ...this.form,
        meetingDate: `${this.formDate}T${this.formTime}:00`,
      };
      if (this.isEdit && this.editId) {
        await this.meetingService.editar(this.editId, payload);
        this.notify.success('Reunião atualizada com sucesso!');
      } else {
        await this.meetingService.criar(payload);
        this.notify.success('Reunião criada com sucesso!');
      }
      this.router.navigate(['/reunioes']);
    } catch {
      this.notify.error('Erro ao salvar reunião.');
    } finally {
      this.saving.set(false);
    }
  }

  initials(name: string): string {
    if (!name?.trim()) return '??';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
