import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService, Meeting, MeetingTopic } from '../../core/services/meeting.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';

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
  `],
  template: `
    <div class="flex flex-col min-h-full">
      <app-toast />

      <!-- Top Bar -->
      @if (meeting()) {
        <div class="flex items-center justify-between px-7 py-5 border-b" style="background: var(--color-surface); border-color: var(--color-border)">
          <div>
            <h1 class="text-xl font-bold" style="color: var(--color-text-primary)">{{ meeting()!.title }}</h1>
            <p class="text-sm mt-0.5" style="color: var(--color-text-muted)">
              {{ formatDate(meeting()!.meetingDate) }} · {{ formatTime(meeting()!.meetingDate) }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="goBack()" class="px-4 py-2 rounded-lg text-sm font-medium"
              style="background: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
              ← Voltar
            </button>
            <button (click)="goEdit()" class="px-4 py-2 rounded-lg text-sm font-medium"
              style="background: var(--color-surface-light); color: var(--color-text-primary); border: 1px solid var(--color-border); cursor: pointer">
              ✏️ Editar
            </button>
            <button (click)="confirmCancel()" class="px-4 py-2 rounded-lg text-sm font-semibold"
              style="background: rgba(239,68,68,0.1); color: var(--color-danger); border: 1px solid rgba(239,68,68,0.2); cursor: pointer">
              🗑 Excluir
            </button>
          </div>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-24 gap-3">
          <div class="spinner w-5 h-5 rounded-full border-2"
               style="border-color: var(--color-primary); border-top-color: transparent"></div>
          <span class="text-sm" style="color: var(--color-text-muted)">Carregando reunião...</span>
        </div>
      } @else if (meeting()) {
        <div class="p-7">

          <!-- Quick info cards -->
          <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="rounded-xl p-4 flex items-center gap-3" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <span class="text-xl">🕐</span>
              <div>
                <div class="text-xs" style="color: var(--color-text-muted)">Duração</div>
                <div class="text-sm font-semibold" style="color: var(--color-text-primary)">{{ meeting()!.duration }} min</div>
              </div>
            </div>
            <div class="rounded-xl p-4 flex items-center gap-3" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <span class="text-xl">📍</span>
              <div>
                <div class="text-xs" style="color: var(--color-text-muted)">Local</div>
                <div class="text-sm font-semibold" style="color: var(--color-text-primary)">{{ meeting()!.location }}</div>
              </div>
            </div>
            <div class="rounded-xl p-4 flex items-center gap-3" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <span class="text-xl">👥</span>
              <div>
                <div class="text-xs" style="color: var(--color-text-muted)">Participantes</div>
                <div class="text-sm font-semibold" style="color: var(--color-text-primary)">
                  {{ confirmedCount() }}/{{ meeting()!.participants.length }} confirmados
                </div>
              </div>
            </div>
            <div class="rounded-xl p-4 flex items-center gap-3" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <span class="text-xl">📋</span>
              <div>
                <div class="text-xs" style="color: var(--color-text-muted)">Pautas</div>
                <div class="text-sm font-semibold" style="color: var(--color-text-primary)">
                  {{ concludedCount() }}/{{ meeting()!.topics.length }} concluídas
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex gap-0 border-b mb-5" style="border-color: var(--color-border)">
            @for (tab of tabs; track tab.id) {
              <button class="tab-btn px-5 py-2.5 text-sm font-medium"
                [style.color]="activeTab() === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)'"
                [style.borderBottom]="activeTab() === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent'"
                style="background: transparent; border-top: none; border-left: none; border-right: none; cursor: pointer; margin-bottom: -1px"
                (click)="activeTab.set(tab.id)">
                {{ tab.label }}
              </button>
            }
          </div>

          <!-- Tab: Detalhes -->
          @if (activeTab() === 'info') {
            <div class="rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <div class="flex items-center gap-3 mb-4">
                <h3 class="text-base font-bold" style="color: var(--color-text-primary)">Descrição</h3>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      [style.background]="statusBg(meeting()!.status!)"
                      [style.color]="statusColor(meeting()!.status!)">
                  {{ statusLabel(meeting()!.status!) }}
                </span>
              </div>
              <p class="text-sm leading-relaxed" style="color: var(--color-text-secondary)">
                {{ meeting()!.description }}
              </p>
              @if (meeting()!.user) {
                <div class="mt-5 pt-4 border-t flex items-center gap-3" style="border-color: var(--color-border)">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                       style="background: linear-gradient(135deg, #6366F1, #8B5CF6)">
                    {{ initials(meeting()!.user!.name) }}
                  </div>
                  <div>
                    <div class="text-xs" style="color: var(--color-text-muted)">Organizado por</div>
                    <div class="text-sm font-semibold" style="color: var(--color-text-primary)">{{ meeting()!.user!.name }}</div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Tab: Participantes -->
          @if (activeTab() === 'participants') {
            <div class="rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-bold" style="color: var(--color-text-primary)">
                  Participantes ({{ meeting()!.participants.length }})
                </h3>
              </div>
              <div class="flex flex-col gap-2">
                @for (p of meeting()!.participants; track p.email; let i = $index) {
                  <div class="participant-row flex items-center gap-3 px-4 py-3 rounded-lg"
                       style="background: var(--color-surface-light)">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                         [style.background]="avatarGradient(i)">
                      {{ initials(p.name) }}
                    </div>
                    <div class="flex-1">
                      <div class="text-sm font-semibold" style="color: var(--color-text-primary)">{{ p.name }}</div>
                      <div class="text-xs" style="color: var(--color-text-muted)">{{ roleLabel(p.role) }}</div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                          [style.background]="participationBg(p.status)"
                          [style.color]="participationColor(p.status)">
                      {{ participationLabel(p.status) }}
                    </span>
                  </div>
                } @empty {
                  <div class="text-center py-10">
                    <p class="text-sm" style="color: var(--color-text-muted)">Nenhum participante cadastrado.</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Tab: Pautas -->
          @if (activeTab() === 'topics') {
            <div class="rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-bold" style="color: var(--color-text-primary)">Pautas</h3>
              </div>
              <div class="flex flex-col gap-2">
                @for (t of meeting()!.topics; track t.id; let i = $index) {
                  <div class="topic-row flex items-center gap-3 p-4 rounded-xl"
                       style="background: var(--color-surface-light)"
                       [style.border]="t.concluded ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--color-border)'">
                    <button (click)="toggleTopic(t)"
                      class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                      [style.background]="t.concluded ? 'var(--color-success)' : 'var(--color-surface-hover)'"
                      style="border: none">
                      @if (t.concluded) {
                        <span class="text-xs text-white font-bold">✓</span>
                      } @else {
                        <span class="text-xs font-bold" style="color: var(--color-text-muted)">{{ i + 1 }}</span>
                      }
                    </button>
                    <div class="flex-1">
                      <div class="text-sm font-semibold"
                           [style.color]="t.concluded ? 'var(--color-text-muted)' : 'var(--color-text-primary)'"
                           [style.textDecoration]="t.concluded ? 'line-through' : 'none'">
                        {{ t.title }}
                      </div>
                      <div class="flex items-center gap-3 mt-1">
                        <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                              [style.background]="priorityBg(t.priority)"
                              [style.color]="priorityColor(t.priority)">
                          {{ t.priority }}
                        </span>
                        <span class="text-xs flex items-center gap-1" style="color: var(--color-text-muted)">
                          ⏱ {{ t.timer }} min
                        </span>
                      </div>
                    </div>
                    <button class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style="background: var(--color-surface-hover); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
                      ⏱ Timer
                    </button>
                  </div>
                } @empty {
                  <div class="text-center py-10">
                    <p class="text-sm" style="color: var(--color-text-muted)">Nenhuma pauta cadastrada.</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Tab: Ata -->
          @if (activeTab() === 'minutes') {
            <div class="flex gap-5 flex-wrap">
              <div class="flex-1 min-w-80 rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-base font-bold" style="color: var(--color-text-primary)">Ata da Reunião</h3>
                  <div class="flex gap-2">
                    <button class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
                      ⚡ Resumo IA
                    </button>
                    <button class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
                      📥 Exportar PDF
                    </button>
                  </div>
                </div>
                <div class="rounded-xl p-4" style="background: var(--color-surface-light); border: 1px solid var(--color-border); min-height: 200px">
                  <textarea [(ngModel)]="minutesText" rows="10"
                    placeholder="Clique aqui para editar a ata da reunião..."
                    class="w-full h-full text-sm leading-relaxed resize-none"
                    style="background: transparent; border: none; color: var(--color-text-secondary); outline: none; width: 100%"></textarea>
                </div>
                <button (click)="saveMinutes()" class="mt-3 px-4 py-2 rounded-lg text-sm font-semibold"
                  style="background: var(--color-primary); color: #000; border: none; cursor: pointer">
                  💾 Salvar Ata
                </button>
              </div>

              <div class="rounded-xl p-5" style="min-width: 220px; background: var(--color-surface); border: 1px solid var(--color-border)">
                <h4 class="text-sm font-bold mb-4" style="color: var(--color-text-primary)">Histórico de Versões</h4>
                <div class="flex flex-col gap-3">
                  @for (v of minutesHistory(); track $index; let i = $index) {
                    <div class="flex items-center gap-3 pb-3 border-b" style="border-color: var(--color-border)">
                      <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                           [style.background]="i === 0 ? 'rgba(6,182,212,0.15)' : 'var(--color-surface-light)'"
                           [style.color]="i === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)'">
                        v{{ minutesHistory().length - i }}
                      </div>
                      <div class="flex-1">
                        <div class="text-xs font-semibold" style="color: var(--color-text-primary)">{{ v.author }}</div>
                        <div class="text-xs" style="color: var(--color-text-muted)">{{ v.date }}</div>
                      </div>
                    </div>
                  } @empty {
                    <p class="text-xs" style="color: var(--color-text-muted)">Nenhuma versão salva ainda.</p>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Tab: Tarefas -->
          @if (activeTab() === 'tasks') {
            <div class="rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-bold" style="color: var(--color-text-primary)">Tarefas da Reunião</h3>
                <button class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style="background: var(--color-primary); color: #000; border: none; cursor: pointer">
                  + Nova Tarefa
                </button>
              </div>
              <div class="text-center py-12">
                <div class="text-4xl mb-3">✅</div>
                <p class="font-medium mb-1" style="color: var(--color-text-secondary)">Nenhuma tarefa criada.</p>
                <p class="text-sm" style="color: var(--color-text-muted)">Tarefas serão implementadas na Fase 3.</p>
              </div>
            </div>
          }

        </div>
      }
    </div>

    <!-- Delete confirm -->
    @if (showDeleteModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.75)">
        <div class="rounded-2xl w-full max-w-sm mx-4 p-6"
             style="background: var(--color-surface); border: 1px solid var(--color-border)">
          <div class="text-3xl mb-4 text-center">⚠️</div>
          <h3 class="text-lg font-semibold text-center mb-2" style="color: var(--color-text-primary)">Confirmar Exclusão</h3>
          <p class="text-sm text-center mb-6" style="color: var(--color-text-secondary)">
            Tem certeza que deseja excluir <strong style="color: var(--color-text-primary)">{{ meeting()?.title }}</strong>?
          </p>
          <div class="flex gap-3">
            <button (click)="showDeleteModal.set(false)" class="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
              Cancelar
            </button>
            <button (click)="executeDelete()" class="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold"
              style="background: var(--color-danger); color: #fff; border: none; cursor: pointer">
              Sim, Excluir
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ReuniaoDetalhe implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private meetingService = inject(MeetingService);
  private notify = inject(NotificationService);

  meeting = signal<Meeting | null>(null);
  loading = signal(false);
  activeTab = signal<'info' | 'participants' | 'topics' | 'minutes' | 'tasks'>('info');
  showDeleteModal = signal(false);
  minutesText = '';
  minutesHistory = signal<{ author: string; date: string }[]>([]);

  readonly tabs = [
    { id: 'info' as const,         label: 'Detalhes'      },
    { id: 'participants' as const, label: 'Participantes'  },
    { id: 'topics' as const,       label: 'Pautas'         },
    { id: 'minutes' as const,      label: 'Ata'            },
    { id: 'tasks' as const,        label: 'Tarefas'        },
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
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void { this.router.navigate(['/reunioes']); }
  goEdit(): void { this.router.navigate(['/reunioes', this.meeting()?.id, 'editar']); }
  confirmCancel(): void { this.showDeleteModal.set(true); }

  async executeDelete(): Promise<void> {
    const id = this.meeting()?.id;
    if (!id) return;
    try {
      await this.meetingService.excluir(id);
      this.notify.success('Reunião excluída.');
      this.router.navigate(['/reunioes']);
    } catch {
      this.notify.error('Erro ao excluir reunião.');
      this.showDeleteModal.set(false);
    }
  }

  toggleTopic(t: MeetingTopic): void {
    t.concluded = !t.concluded;
  }

  saveMinutes(): void {
    const now = new Date();
    const label = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    this.minutesHistory.update(h => [{ author: 'Você', date: label }, ...h]);
    this.notify.success('Ata salva com sucesso!');
  }

  confirmedCount(): number {
    return this.meeting()?.participants.filter(p => p.status === 'SIM').length ?? 0;
  }

  concludedCount(): number {
    return this.meeting()?.topics.filter(t => t.concluded).length ?? 0;
  }

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

  statusLabel(s: string): string {
    const m: Record<string, string> = { AGENDADA: 'Agendada', EM_ANDAMENTO: 'Em andamento', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada' };
    return m[s] ?? s;
  }

  statusColor(s: string): string {
    const m: Record<string, string> = { AGENDADA: 'var(--color-primary)', EM_ANDAMENTO: 'var(--color-warning)', FINALIZADA: 'var(--color-success)', CANCELADA: 'var(--color-danger)' };
    return m[s] ?? 'var(--color-text-secondary)';
  }

  statusBg(s: string): string {
    const m: Record<string, string> = { AGENDADA: 'rgba(6,182,212,0.15)', EM_ANDAMENTO: 'rgba(245,158,11,0.15)', FINALIZADA: 'rgba(16,185,129,0.15)', CANCELADA: 'rgba(239,68,68,0.15)' };
    return m[s] ?? 'rgba(148,163,184,0.1)';
  }

  roleLabel(r: string): string {
    const m: Record<string, string> = { ORGANIZADOR: 'Organizador', PARTICIPANTE: 'Participante', PALESTRANTE: 'Palestrante' };
    return m[r] ?? r;
  }

  participationLabel(s?: string | null): string {
    const m: Record<string, string> = { SIM: 'Confirmado', NAO: 'Recusado', TALVEZ: 'Talvez' };
    return s ? (m[s] ?? s) : 'Pendente';
  }

  participationColor(s?: string | null): string {
    const m: Record<string, string> = { SIM: 'var(--color-success)', NAO: 'var(--color-danger)', TALVEZ: 'var(--color-warning)' };
    return s ? (m[s] ?? 'var(--color-text-muted)') : 'var(--color-text-muted)';
  }

  participationBg(s?: string | null): string {
    const m: Record<string, string> = { SIM: 'rgba(16,185,129,0.15)', NAO: 'rgba(239,68,68,0.15)', TALVEZ: 'rgba(245,158,11,0.15)' };
    return s ? (m[s] ?? 'rgba(148,163,184,0.1)') : 'rgba(148,163,184,0.1)';
  }

  priorityColor(p: string): string {
    const m: Record<string, string> = { ALTA: 'var(--color-danger)', MEDIA: 'var(--color-warning)', BAIXA: 'var(--color-success)' };
    return m[p] ?? 'var(--color-text-secondary)';
  }

  priorityBg(p: string): string {
    const m: Record<string, string> = { ALTA: 'rgba(239,68,68,0.15)', MEDIA: 'rgba(245,158,11,0.15)', BAIXA: 'rgba(16,185,129,0.15)' };
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

  avatarGradient(i: number): string {
    return this.gradients[i % this.gradients.length];
  }
}
