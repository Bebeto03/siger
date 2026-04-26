import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MeetingService } from '../../core/services/meeting.service';
import { ParticipantService } from '../../core/services/participant.service';
import { TopicService } from '../../core/services/topic.service';
import { MeetingMinutesService } from '../../core/services/meeting-minutes.service';
import { LogService } from '../../core/services/log.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';
import { Meeting, MeetingStatus } from '../../core/models/meeting.model';
import { Participant, ParticipantParticipation } from '../../core/models/participant.model';
import { Topic, TopicPriority } from '../../core/models/topic.model';
import { MeetingMinutes } from '../../core/models/meeting-minutes.model';
import { TaskService } from '../../core/services/task.service';
import { Task, TaskStatus } from '../../core/models/task.model';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';

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
            <button (click)="showDeleteModal.set(true)" class="px-4 py-2 rounded-lg text-sm font-semibold"
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
                  {{ confirmedCount() }}/{{ participants().length }} confirmados
                </div>
              </div>
            </div>
            <div class="rounded-xl p-4 flex items-center gap-3" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <span class="text-xl">📋</span>
              <div>
                <div class="text-xs" style="color: var(--color-text-muted)">Pautas</div>
                <div class="text-sm font-semibold" style="color: var(--color-text-primary)">
                  {{ concludedCount() }}/{{ topics().length }} concluídas
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
                {{ meeting()!.description || 'Sem descrição.' }}
              </p>
              @if (meeting()!.organizer?.name) {
                <div class="mt-5 pt-4 border-t flex items-center gap-3" style="border-color: var(--color-border)">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                       style="background: linear-gradient(135deg, #6366F1, #8B5CF6)">
                    {{ initials(meeting()!.organizer!.name!) }}
                  </div>
                  <div>
                    <div class="text-xs" style="color: var(--color-text-muted)">Organizado por</div>
                    <div class="text-sm font-semibold" style="color: var(--color-text-primary)">{{ meeting()!.organizer!.name }}</div>
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
                  Participantes ({{ participants().length }})
                </h3>
              </div>
              @if (loadingParticipants()) {
                <div class="flex items-center gap-2 py-6" style="color: var(--color-text-muted)">
                  <div class="spinner w-4 h-4 rounded-full border-2" style="border-color: var(--color-primary); border-top-color: transparent"></div>
                  <span class="text-sm">Carregando participantes...</span>
                </div>
              } @else {
                <div class="flex flex-col gap-2">
                  @for (p of participants(); track p.id; let i = $index) {
                    <div class="participant-row flex items-center gap-3 px-4 py-3 rounded-lg"
                         style="background: var(--color-surface-light)">
                      <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                           [style.background]="avatarGradient(i)">
                        {{ initials(p.user.name ?? '') }}
                      </div>
                      <div class="flex-1">
                        <div class="text-sm font-semibold" style="color: var(--color-text-primary)">
                          {{ p.user.name || p.user.email || 'Usuário #' + p.user.id }}
                        </div>
                        <div class="text-xs" style="color: var(--color-text-muted)">{{ roleLabel(p.role) }}</div>
                      </div>
                      <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                            [style.background]="participationBg(p.participation)"
                            [style.color]="participationColor(p.participation)">
                        {{ participationLabel(p.participation) }}
                      </span>
                    </div>
                  } @empty {
                    <div class="text-center py-10">
                      <p class="text-sm" style="color: var(--color-text-muted)">Nenhum participante cadastrado.</p>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Tab: Pautas -->
          @if (activeTab() === 'topics') {
            <div class="rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-bold" style="color: var(--color-text-primary)">Pautas</h3>
              </div>
              @if (loadingTopics()) {
                <div class="flex items-center gap-2 py-6" style="color: var(--color-text-muted)">
                  <div class="spinner w-4 h-4 rounded-full border-2" style="border-color: var(--color-primary); border-top-color: transparent"></div>
                  <span class="text-sm">Carregando pautas...</span>
                </div>
              } @else {
                <div class="flex flex-col gap-2">
                  @for (t of topics(); track t.id; let i = $index) {
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
                          @if (t.timer) {
                            <span class="text-xs flex items-center gap-1" style="color: var(--color-text-muted)">
                              ⏱ {{ t.timer }} min
                            </span>
                          }
                        </div>
                      </div>

                      <!-- Timer button -->
                      @if (activeTimer()?.topicId === t.id) {
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-mono font-bold timer-pulse" style="color: var(--color-primary)">
                            {{ formatTimer(activeTimer()!.remaining) }}
                          </span>
                          <button (click)="stopTimer()"
                            class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style="background: rgba(239,68,68,0.1); color: var(--color-danger); border: 1px solid rgba(239,68,68,0.2); cursor: pointer">
                            ⏹ Parar
                          </button>
                        </div>
                      } @else {
                        <button (click)="startTimer(t)"
                          class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          [style.opacity]="t.concluded ? '0.4' : '1'"
                          style="background: var(--color-surface-hover); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
                          ⏱ Timer
                        </button>
                      }
                    </div>
                  } @empty {
                    <div class="text-center py-10">
                      <p class="text-sm" style="color: var(--color-text-muted)">Nenhuma pauta cadastrada.</p>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Tab: Ata -->
          @if (activeTab() === 'minutes') {
            <div class="flex gap-5 flex-wrap">
              <div class="flex-1 min-w-80 rounded-xl p-5" style="background: var(--color-surface); border: 1px solid var(--color-border)">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-base font-bold" style="color: var(--color-text-primary)">Ata da Reunião</h3>
                  <div class="flex gap-2">
                    <button (click)="onComingSoon('Resumo IA')" class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
                      ⚡ Resumo IA
                    </button>
                    <button (click)="onComingSoon('Exportar PDF')" class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
                      📥 Exportar PDF
                    </button>
                  </div>
                </div>

                @if (loadingMinutes()) {
                  <div class="flex items-center gap-2 py-6" style="color: var(--color-text-muted)">
                    <div class="spinner w-4 h-4 rounded-full border-2" style="border-color: var(--color-primary); border-top-color: transparent"></div>
                    <span class="text-sm">Carregando ata...</span>
                  </div>
                } @else {
                  <div class="flex flex-col gap-4 mb-4">
                    <div>
                      <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Objetivos</label>
                      <input [(ngModel)]="minutesForm.objectives" placeholder="Objetivos da reunião..."
                        class="w-full px-3 py-2 rounded-lg text-sm"
                        style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-primary); outline: none" />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Notas</label>
                      <textarea [(ngModel)]="minutesForm.notes" rows="4" placeholder="Notas e observações da reunião..."
                        class="w-full px-3 py-2 rounded-lg text-sm resize-y"
                        style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-primary); outline: none"></textarea>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Decisões</label>
                      <textarea [(ngModel)]="minutesForm.decision" rows="3" placeholder="Decisões tomadas na reunião..."
                        class="w-full px-3 py-2 rounded-lg text-sm resize-y"
                        style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-primary); outline: none"></textarea>
                    </div>
                  </div>
                  <button (click)="saveMinutes()" [disabled]="savingMinutes()"
                    class="px-4 py-2 rounded-lg text-sm font-semibold"
                    [style.opacity]="savingMinutes() ? '0.7' : '1'"
                    style="background: var(--color-primary); color: #000; border: none; cursor: pointer">
                    {{ savingMinutes() ? 'Salvando...' : '💾 Salvar Ata' }}
                  </button>
                }
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
                <h3 class="text-base font-bold" style="color: var(--color-text-primary)">
                  Tarefas da Reunião ({{ tasks().length }})
                </h3>
                <button (click)="openTaskModal()"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style="background: var(--color-primary); color: #000; border: none; cursor: pointer">
                  + Nova Tarefa
                </button>
              </div>
              @if (loadingTasks()) {
                <div class="flex items-center gap-2 py-6" style="color: var(--color-text-muted)">
                  <div class="spinner w-4 h-4 rounded-full border-2" style="border-color: var(--color-primary); border-top-color: transparent"></div>
                  <span class="text-sm">Carregando tarefas...</span>
                </div>
              } @else {
                <div class="flex flex-col gap-2">
                  @for (t of tasks(); track t.id) {
                    <div class="flex items-center gap-3 p-4 rounded-xl"
                         style="background: var(--color-surface-light); border: 1px solid var(--color-border)">
                      <span class="text-lg shrink-0">
                        {{ t.status === 'CONCLUIDA' ? '✅' : t.status === 'EM_ANDAMENTO' ? '🔄' : '⬜' }}
                      </span>
                      <div class="flex-1">
                        <div class="text-sm font-semibold"
                             [style.color]="t.status === 'CONCLUIDA' ? 'var(--color-text-muted)' : 'var(--color-text-primary)'"
                             [style.textDecoration]="t.status === 'CONCLUIDA' ? 'line-through' : 'none'">
                          {{ t.title }}
                        </div>
                        <div class="text-xs mt-1 flex items-center gap-3" style="color: var(--color-text-muted)">
                          @if (t.assignee?.name) {
                            <span>👤 {{ t.assignee!.name }}</span>
                          }
                          @if (t.dueDate) {
                            <span>🕐 Prazo: {{ formatShortDate(t.dueDate) }}</span>
                          }
                        </div>
                      </div>
                      <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                            [style.background]="taskStatusBg(t.status)"
                            [style.color]="taskStatusColor(t.status)">
                        {{ taskStatusLabel(t.status) }}
                      </span>
                    </div>
                  } @empty {
                    <div class="text-center py-10">
                      <div class="text-4xl mb-3">✅</div>
                      <p class="font-medium mb-1" style="color: var(--color-text-secondary)">Nenhuma tarefa criada.</p>
                      <p class="text-sm" style="color: var(--color-text-muted)">Clique em "+ Nova Tarefa" para adicionar.</p>
                    </div>
                  }
                </div>
              }
            </div>
          }

        </div>
      }
    </div>

    <!-- Modal Nova Tarefa -->
    @if (showTaskModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.7); backdrop-filter: blur(4px)">
        <div class="rounded-2xl w-full mx-4 p-6" style="max-width: 440px; background: var(--color-surface); border: 1px solid var(--color-border)">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-bold" style="color: var(--color-text-primary)">Nova Tarefa</h2>
            <button (click)="showTaskModal.set(false)" style="background: var(--color-surface-light); border: none; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; color: var(--color-text-muted); font-size: 16px">✕</button>
          </div>
          <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Título *</label>
          <input [(ngModel)]="taskForm.title" placeholder="Descreva a tarefa..."
            class="w-full px-3 py-2.5 mb-4 rounded-lg"
            style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-primary); outline: none" />
          <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Responsável</label>
          <select [(ngModel)]="taskForm.assigneeId" class="w-full px-3 py-2.5 mb-4 rounded-lg"
            style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-primary); outline: none">
            <option [ngValue]="null">Sem responsável</option>
            @for (u of allUsers(); track u.id) {
              <option [ngValue]="u.id">{{ u.name }}</option>
            }
          </select>
          <label class="block text-xs font-semibold uppercase tracking-wider mb-1.5" style="color: var(--color-text-secondary)">Prazo</label>
          <input type="date" [(ngModel)]="taskForm.dueDate" class="w-full px-3 py-2.5 mb-6 rounded-lg"
            style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-primary); outline: none" />
          <div class="flex gap-3">
            <button (click)="showTaskModal.set(false)" class="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
              Cancelar
            </button>
            <button (click)="submitTask()" [disabled]="savingTask() || !taskForm.title?.trim()"
              class="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold"
              [style.opacity]="savingTask() || !taskForm.title?.trim() ? '0.5' : '1'"
              style="background: var(--color-primary); color: #000; border: none; cursor: pointer">
              {{ savingTask() ? 'Criando...' : 'Criar Tarefa' }}
            </button>
          </div>
        </div>
      </div>
    }

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
        status:   'PENDENTE',
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
    const m: Record<TaskStatus, string> = { PENDENTE: 'Pendente', EM_ANDAMENTO: 'Em andamento', CONCLUIDA: 'Concluída' };
    return m[s] ?? s;
  }

  taskStatusColor(s: TaskStatus): string {
    const m: Record<TaskStatus, string> = { PENDENTE: 'var(--color-text-muted)', EM_ANDAMENTO: 'var(--color-warning)', CONCLUIDA: 'var(--color-success)' };
    return m[s] ?? 'var(--color-text-secondary)';
  }

  taskStatusBg(s: TaskStatus): string {
    const m: Record<TaskStatus, string> = { PENDENTE: 'rgba(148,163,184,0.1)', EM_ANDAMENTO: 'rgba(245,158,11,0.15)', CONCLUIDA: 'rgba(16,185,129,0.15)' };
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
    const m: Record<MeetingStatus, string> = { NAO_INICIADO: 'Não iniciada', EM_ANDAMENTO: 'Em andamento', CONCLUIDO: 'Concluída' };
    return m[s] ?? s;
  }

  statusColor(s: MeetingStatus): string {
    const m: Record<MeetingStatus, string> = { NAO_INICIADO: 'var(--color-primary)', EM_ANDAMENTO: 'var(--color-warning)', CONCLUIDO: 'var(--color-success)' };
    return m[s] ?? 'var(--color-text-secondary)';
  }

  statusBg(s: MeetingStatus): string {
    const m: Record<MeetingStatus, string> = { NAO_INICIADO: 'rgba(6,182,212,0.15)', EM_ANDAMENTO: 'rgba(245,158,11,0.15)', CONCLUIDO: 'rgba(16,185,129,0.15)' };
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
