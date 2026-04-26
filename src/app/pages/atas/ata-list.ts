import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingMinutesService } from '../../core/services/meeting-minutes.service';
import { MeetingService } from '../../core/services/meeting.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';
import { MeetingMinutes } from '../../core/models/meeting-minutes.model';
import { Meeting } from '../../core/models/meeting.model';

interface AtaDisplay {
  minutes: MeetingMinutes;
  meeting?: Meeting;
}

@Component({
  selector: 'app-ata-list',
  standalone: true,
  imports: [FormsModule, ToastComponent],
  styles: [`
    .ata-card { transition: border-color 0.15s, box-shadow 0.15s; cursor: pointer; }
    .ata-card:hover { border-color: var(--color-primary) !important; box-shadow: 0 0 0 1px rgba(6,182,212,0.15); }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.8s linear infinite; }
  `],
  template: `
    <div class="flex flex-col min-h-full">
      <app-toast />

      <!-- Top Bar -->
      <div class="flex items-center justify-between px-7 py-5 border-b" style="background: var(--color-surface); border-color: var(--color-border)">
        <div>
          <h1 class="text-xl font-bold" style="color: var(--color-text-primary)">Atas</h1>
          <p class="text-sm mt-0.5" style="color: var(--color-text-muted)">Histórico de atas das reuniões</p>
        </div>
      </div>

      <div class="p-7">
        <!-- Search -->
        <div class="relative mb-5">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style="color: var(--color-text-muted)">🔍</span>
          <input type="text" [ngModel]="searchText()" (ngModelChange)="searchText.set($event)"
            placeholder="Buscar por objetivos ou reunião..."
            class="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
            style="background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-primary); outline: none" />
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="flex items-center justify-center py-20 gap-3">
            <div class="spinner w-5 h-5 rounded-full border-2"
                 style="border-color: var(--color-primary); border-top-color: transparent"></div>
            <span class="text-sm" style="color: var(--color-text-muted)">Carregando atas...</span>
          </div>
        } @else {
          <div class="flex flex-col gap-3">
            @for (item of filtered(); track item.minutes.id) {
              <div class="ata-card rounded-xl p-5"
                   style="background: var(--color-surface); border: 1px solid var(--color-border)"
                   (click)="goToMeeting(item.minutes.meeting.id)">
                <div class="flex items-start gap-4">

                  <!-- Icon -->
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
                       style="background: rgba(6,182,212,0.1)">
                    📋
                  </div>

                  <div class="flex-1 min-w-0">
                    <!-- Meeting title -->
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                      @if (item.meeting) {
                        <span class="font-semibold" style="color: var(--color-text-primary)">{{ item.meeting.title }}</span>
                        <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                              [style.background]="statusBg(item.meeting.status!)"
                              [style.color]="statusColor(item.meeting.status!)">
                          {{ statusLabel(item.meeting.status!) }}
                        </span>
                      } @else {
                        <span class="font-semibold" style="color: var(--color-text-primary)">Reunião #{{ item.minutes.meeting.id }}</span>
                      }
                    </div>

                    <!-- Objectives -->
                    @if (item.minutes.objectives) {
                      <p class="text-sm mb-2 truncate" style="color: var(--color-text-secondary)">
                        <strong style="color: var(--color-text-muted)">Objetivos:</strong> {{ item.minutes.objectives }}
                      </p>
                    }

                    <!-- Decision -->
                    @if (item.minutes.decision) {
                      <p class="text-xs truncate" style="color: var(--color-text-muted)">
                        <strong>Decisão:</strong> {{ item.minutes.decision }}
                      </p>
                    }

                    @if (!item.minutes.objectives && !item.minutes.decision) {
                      <p class="text-sm" style="color: var(--color-text-muted)">Ata sem conteúdo ainda.</p>
                    }

                    @if (item.meeting?.meetingDate) {
                      <div class="flex items-center gap-1 mt-2">
                        <span class="text-xs" style="color: var(--color-text-muted)">
                          📅 {{ formatDate(item.meeting!.meetingDate) }}
                        </span>
                      </div>
                    }
                  </div>

                  <div class="shrink-0">
                    <button class="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
                      Ver reunião →
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="text-center py-20">
                <div class="text-5xl mb-4">📋</div>
                <p class="font-medium" style="color: var(--color-text-secondary)">
                  {{ searchText() ? 'Nenhuma ata encontrada.' : 'Nenhuma ata registrada ainda.' }}
                </p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class AtaList implements OnInit {
  private minutesService = inject(MeetingMinutesService);
  private meetingService = inject(MeetingService);
  private notify         = inject(NotificationService);
  private router         = inject(Router);

  atas     = signal<AtaDisplay[]>([]);
  loading  = signal(false);
  searchText = signal('');

  filtered = computed(() => {
    const q = this.searchText().toLowerCase().trim();
    if (!q) return this.atas();
    return this.atas().filter(a =>
      a.meeting?.title?.toLowerCase().includes(q) ||
      a.minutes.objectives?.toLowerCase().includes(q) ||
      a.minutes.decision?.toLowerCase().includes(q)
    );
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const [minutes, meetings] = await Promise.all([
        this.minutesService.listar(),
        this.meetingService.listar().catch(() => [] as Meeting[]),
      ]);
      this.atas.set(
        minutes.map(m => ({
          minutes: m,
          meeting: meetings.find(mt => mt.id === m.meeting.id),
        }))
      );
    } catch {
      this.notify.error('Erro ao carregar atas.');
    } finally {
      this.loading.set(false);
    }
  }

  goToMeeting(meetingId: number): void {
    this.router.navigate(['/reunioes', meetingId], { fragment: 'minutes' });
  }

  formatDate(dateStr: string): string {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2,'0')} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'Não iniciada', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluída' };
    return m[s] ?? s;
  }

  statusColor(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'var(--color-primary)', EM_ANDAMENTO: 'var(--color-warning)', CONCLUIDO: 'var(--color-success)' };
    return m[s] ?? 'var(--color-text-secondary)';
  }

  statusBg(s: string): string {
    const m: Record<string, string> = { NAO_INICIADO: 'rgba(6,182,212,0.15)', EM_ANDAMENTO: 'rgba(245,158,11,0.15)', CONCLUIDO: 'rgba(16,185,129,0.15)' };
    return m[s] ?? 'rgba(148,163,184,0.1)';
  }
}
