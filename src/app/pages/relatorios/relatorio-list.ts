import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MeetingService } from '../../core/services/meeting.service';
import { TaskService } from '../../core/services/task.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';

const MONTHS_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const DAYS  = ['Seg','Ter','Qua','Qui','Sex'];

const ATTENDANCE_DATA = [
  { month: 'Out', pct: 78 },
  { month: 'Nov', pct: 82 },
  { month: 'Dez', pct: 85 },
  { month: 'Jan', pct: 80 },
  { month: 'Fev', pct: 88 },
  { month: 'Mar', pct: 87 },
];

const HEATMAP_BASE = [
  [0.30, 0.90, 0.80, 0.50, 0.20, 0.10, 0.70, 0.60, 0.40, 0.30],
  [0.55, 0.75, 0.60, 0.95, 0.40, 0.20, 0.85, 0.45, 0.65, 0.50],
  [0.70, 0.85, 0.90, 0.60, 0.30, 0.15, 0.75, 0.80, 0.50, 0.40],
  [0.45, 0.65, 0.70, 0.80, 0.25, 0.10, 0.60, 0.55, 0.35, 0.25],
  [0.20, 0.40, 0.55, 0.35, 0.15, 0.05, 0.30, 0.25, 0.20, 0.15],
];

@Component({
  selector: 'app-relatorio-list',
  standalone: true,
  imports: [ToastComponent, DecimalPipe],
  styles: [`
    .chart-bar { transition: opacity 0.2s; border-radius: 6px 6px 0 0; cursor: default; }
    .chart-bar:hover { opacity: 0.8; }
    .heat-cell { border-radius: 4px; cursor: default; transition: opacity 0.15s; }
    .heat-cell:hover { opacity: 0.7; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.8s linear infinite; }
  `],
  template: `
    <div class="flex flex-col min-h-full">
      <app-toast />

      <!-- Top Bar -->
      <div class="flex items-center justify-between px-7 py-5 border-b"
           style="background: var(--color-surface); border-color: var(--color-border)">
        <div>
          <h1 class="text-xl font-bold" style="color: var(--color-text-primary)">Relatórios</h1>
          <p class="text-sm mt-0.5" style="color: var(--color-text-muted)">Indicadores e análises do sistema</p>
        </div>
        <button class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style="background: var(--color-surface-light); color: var(--color-text-primary); border: 1px solid var(--color-border); cursor: pointer"
                (click)="notify.info('Exportação de PDF — em breve!')">
          ⬇ Exportar PDF
        </button>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-20 gap-3">
          <div class="spinner w-5 h-5 rounded-full border-2"
               style="border-color: var(--color-primary); border-top-color: transparent"></div>
          <span class="text-sm" style="color: var(--color-text-muted)">Carregando relatórios...</span>
        </div>
      } @else {
        <div class="p-7">
          <!-- Stat Cards -->
          <div class="grid gap-4 mb-6" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))">
            <div class="rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                   style="background: rgba(6,182,212,0.12)">📅</div>
              <div class="text-3xl font-black mb-1" style="color: var(--color-text-primary); letter-spacing: -1px">
                {{ totalMeetings() }}
              </div>
              <div class="text-xs" style="color: var(--color-text-muted)">Total de reuniões</div>
            </div>

            <div class="rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                   style="background: rgba(16,185,129,0.12)">👥</div>
              <div class="text-3xl font-black mb-1" style="color: var(--color-text-primary); letter-spacing: -1px">87%</div>
              <div class="text-xs" style="color: var(--color-text-muted)">Taxa média de presença</div>
            </div>

            <div class="rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                   style="background: rgba(245,158,11,0.12)">⏱</div>
              <div class="text-3xl font-black mb-1" style="color: var(--color-text-primary); letter-spacing: -1px">
                {{ avgDuration() }} min
              </div>
              <div class="text-xs" style="color: var(--color-text-muted)">Tempo médio</div>
            </div>

            <div class="rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                   style="background: rgba(139,92,246,0.12)">📈</div>
              <div class="text-3xl font-black mb-1" style="color: var(--color-text-primary); letter-spacing: -1px">92%</div>
              <div class="text-xs" style="color: var(--color-text-muted)">Eficiência geral</div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="flex gap-5 mb-5 flex-wrap">
            <!-- Attendance Bar Chart -->
            <div class="rounded-xl p-5" style="flex: 1; min-width: 300px; background: var(--color-surface); border: 1px solid var(--color-border)">
              <h3 class="text-sm font-bold mb-5" style="color: var(--color-text-primary)">
                Taxa de Comparecimento (últimos 6 meses)
              </h3>
              <div class="flex items-end gap-3 px-2" style="height: 140px">
                @for (bar of attendanceBars; track bar.month) {
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <span class="text-xs font-semibold" style="color: var(--color-primary)">{{ bar.pct }}%</span>
                    <div class="chart-bar w-full"
                         [style.height]="(bar.pct * 1.1) + 'px'"
                         style="background: linear-gradient(180deg, var(--color-primary), #0891B2)">
                    </div>
                  </div>
                }
              </div>
              <div class="flex justify-around mt-2">
                @for (bar of attendanceBars; track bar.month) {
                  <span class="text-xs" style="color: var(--color-text-muted)">{{ bar.month }}</span>
                }
              </div>
            </div>

            <!-- Status Donut -->
            <div class="rounded-xl p-5" style="flex: 1; min-width: 300px; background: var(--color-surface); border: 1px solid var(--color-border)">
              <h3 class="text-sm font-bold mb-5" style="color: var(--color-text-primary)">Distribuição de Status</h3>
              <div class="flex items-center justify-center gap-8">
                <!-- SVG Donut -->
                <div class="relative shrink-0" style="width: 120px; height: 120px">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="48" fill="none"
                            style="stroke: var(--color-surface-light)" stroke-width="16"/>
                    <!-- Concluído -->
                    <circle cx="60" cy="60" r="48" fill="none"
                            stroke="#10B981" stroke-width="16"
                            [attr.stroke-dasharray]="(concluido() * 301.6) + ' 301.6'"
                            stroke-dashoffset="0"
                            transform="rotate(-90 60 60)" stroke-linecap="round"/>
                    <!-- Agendado -->
                    <circle cx="60" cy="60" r="48" fill="none"
                            stroke="#06B6D4" stroke-width="16"
                            [attr.stroke-dasharray]="(agendado() * 301.6) + ' 301.6'"
                            [attr.stroke-dashoffset]="-(concluido() * 301.6)"
                            transform="rotate(-90 60 60)" stroke-linecap="round"/>
                    <!-- Em andamento -->
                    <circle cx="60" cy="60" r="48" fill="none"
                            stroke="#F59E0B" stroke-width="16"
                            [attr.stroke-dasharray]="(emAndamento() * 301.6) + ' 301.6'"
                            [attr.stroke-dashoffset]="-(concluido() + agendado()) * 301.6"
                            transform="rotate(-90 60 60)" stroke-linecap="round"/>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-lg font-black" style="color: var(--color-text-primary)">{{ totalMeetings() }}</span>
                    <span class="text-[9px]" style="color: var(--color-text-muted)">total</span>
                  </div>
                </div>

                <!-- Legend -->
                <div class="flex flex-col gap-2.5">
                  @for (item of statusDistribution(); track item.label) {
                    <div class="flex items-center gap-2">
                      <div class="w-2.5 h-2.5 rounded-sm shrink-0" [style.background]="item.color"></div>
                      <span class="text-xs w-24" style="color: var(--color-text-secondary)">{{ item.label }}</span>
                      <span class="text-xs font-bold" style="color: var(--color-text-primary)">{{ item.count }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Heatmap -->
          <div class="rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
            <h3 class="text-sm font-bold mb-4" style="color: var(--color-text-primary)">Mapa de Calor — Melhor Horário</h3>
            <div style="overflow-x: auto">
              <div style="display: grid; grid-template-columns: 44px repeat(10, 1fr); gap: 3px; min-width: 500px">
                <!-- Header row -->
                <div></div>
                @for (h of hours; track h) {
                  <div class="text-center text-[10px] pb-1" style="color: var(--color-text-muted)">{{ h }}</div>
                }
                <!-- Data rows -->
                @for (row of heatmapRows; track row.day; let di = $index) {
                  <div class="flex items-center text-xs font-semibold" style="color: var(--color-text-secondary)">{{ row.day }}</div>
                  @for (cell of row.cells; track $index) {
                    <div class="heat-cell"
                         style="height: 28px"
                         [style.background]="'rgba(6,182,212,' + (cell * 0.7 + 0.05) + ')'"
                         [title]="row.day + ' ' + hours[$index] + ' — ' + (cell * 100 | number:'1.0-0') + '% presença'">
                    </div>
                  }
                }
              </div>
            </div>
            <!-- Legend -->
            <div class="flex items-center gap-2 mt-3 justify-end">
              <span class="text-xs" style="color: var(--color-text-muted)">Baixo</span>
              @for (step of heatLegend; track $index) {
                <div class="rounded" style="width: 18px; height: 14px"
                     [style.background]="'rgba(6,182,212,' + step + ')'"></div>
              }
              <span class="text-xs" style="color: var(--color-text-muted)">Alto</span>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class RelatorioList implements OnInit {
  readonly notify = inject(NotificationService);
  private meetingService = inject(MeetingService);
  private taskService = inject(TaskService);

  loading = signal(true);
  meetingList = signal<{ status?: string; duration?: number }[]>([]);

  readonly attendanceBars = ATTENDANCE_DATA;
  readonly hours = HOURS;

  readonly heatmapRows = DAYS.map((day, di) => ({
    day,
    cells: HEATMAP_BASE[di],
  }));

  readonly heatLegend = [0.1, 0.25, 0.4, 0.55, 0.7];

  totalMeetings = computed(() => this.meetingList().length || 156);

  avgDuration = computed(() => {
    const all = this.meetingList().filter(m => m.duration);
    if (!all.length) return 42;
    return Math.round(all.reduce((s, m) => s + (m.duration ?? 0), 0) / all.length);
  });

  concluido  = computed(() => {
    const all = this.meetingList();
    if (!all.length) return 0.60;
    return all.filter(m => m.status === 'CONCLUIDO').length / all.length;
  });

  agendado   = computed(() => {
    const all = this.meetingList();
    if (!all.length) return 0.25;
    return all.filter(m => m.status === 'NAO_INICIADO').length / all.length;
  });

  emAndamento = computed(() => {
    const all = this.meetingList();
    if (!all.length) return 0.15;
    return all.filter(m => m.status === 'EM_ANDAMENTO').length / all.length;
  });

  statusDistribution = computed(() => {
    const all = this.meetingList();
    const total = all.length || 156;
    const c = all.filter(m => m.status === 'CONCLUIDO').length || 93;
    const a = all.filter(m => m.status === 'NAO_INICIADO').length || 39;
    const e = all.filter(m => m.status === 'EM_ANDAMENTO').length || 24;
    return [
      { label: 'Concluídas',    count: c, color: '#10B981' },
      { label: 'Agendadas',     count: a, color: '#06B6D4' },
      { label: 'Em andamento',  count: e, color: '#F59E0B' },
    ];
  });

  async ngOnInit(): Promise<void> {
    try {
      const meetings = await this.meetingService.listar();
      this.meetingList.set(meetings);
    } catch {
      // degraded with static data
    } finally {
      this.loading.set(false);
    }
  }
}
