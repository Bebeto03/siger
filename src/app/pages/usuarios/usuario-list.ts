import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';
import { UsuarioForm } from './usuario-form';
import { Enums } from '../../core/models/enums';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [FormsModule, ToastComponent, UsuarioForm],
  styles: [`
    .table-row { transition: background 0.15s; }
    .table-row:hover { background: var(--color-surface-hover) !important; }
    .btn-edit:hover { border-color: var(--color-primary) !important; }
    .btn-delete:hover { background: rgba(239,68,68,0.2) !important; }
    .btn-new:hover { background: var(--color-primary-dark) !important; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 0.8s linear infinite; }
  `],
  template: `
    <div class="flex flex-col gap-6 p-6 min-h-full">
      <app-toast />

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">Usuários</h1>
          <p class="text-sm mt-1" style="color: var(--color-text-muted)">Gerencie os usuários do sistema</p>
        </div>
        <button (click)="openNew()" class="btn-new flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm"
          style="background: var(--color-primary); color: #000; border: none; cursor: pointer; transition: background 0.15s">
          <span>+</span> Novo Usuário
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="rounded-xl p-4" style="background: var(--color-surface); border: 1px solid var(--color-border)">
          <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted)">Total</p>
          <p class="text-3xl font-bold mt-2" style="color: var(--color-text-primary)">{{ users().length }}</p>
        </div>
        <div class="rounded-xl p-4" style="background: var(--color-surface); border: 1px solid var(--color-border)">
          <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted)">Ativos</p>
          <p class="text-3xl font-bold mt-2" style="color: var(--color-success)">{{ totalAtivos }}</p>
        </div>
        <div class="rounded-xl p-4" style="background: var(--color-surface); border: 1px solid var(--color-border)">
          <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-muted)">Administradores</p>
          <p class="text-3xl font-bold mt-2" style="color: var(--color-primary)">{{ totalAdmins }}</p>
        </div>
      </div>

      <!-- Table Card -->
      <div class="rounded-xl overflow-hidden" style="background: var(--color-surface); border: 1px solid var(--color-border)">

        <!-- Search -->
        <div class="p-4 border-b" style="border-color: var(--color-border)">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style="color: var(--color-text-muted)">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              [(ngModel)]="searchText"
              class="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm"
              style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-primary)" />
          </div>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="flex items-center justify-center py-16 gap-3">
            <div class="spinner w-5 h-5 rounded-full border-2"
                 style="border-color: var(--color-primary); border-top-color: transparent"></div>
            <span class="text-sm" style="color: var(--color-text-muted)">Carregando usuários...</span>
          </div>
        } @else {
          <table class="w-full text-sm">
            <thead>
              <tr style="border-bottom: 1px solid var(--color-border)">
                <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider"
                    style="color: var(--color-text-muted)">Usuário</th>
                <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider"
                    style="color: var(--color-text-muted)">Tipo</th>
                <th class="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider"
                    style="color: var(--color-text-muted)">Status</th>
                <th class="text-right px-5 py-3 font-semibold text-xs uppercase tracking-wider"
                    style="color: var(--color-text-muted)">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (user of filtered; track user.id) {
                <tr class="table-row border-b" style="border-color: var(--color-border)">
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                           style="background: linear-gradient(135deg, #6366F1, #8B5CF6)">
                        {{ initials(user.name) }}
                      </div>
                      <div>
                        <div class="font-medium" style="color: var(--color-text-primary)">{{ user.name }}</div>
                        <div class="text-xs mt-0.5" style="color: var(--color-text-muted)">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3.5">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                          [style.background]="typeBg(user.type)"
                          [style.color]="typeColor(user.type)">
                      {{ typeLabel(user.type) }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                          [style.background]="user.status === 'ATIVO' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'"
                          [style.color]="user.status === 'ATIVO' ? 'var(--color-success)' : 'var(--color-warning)'">
                      {{ user.status === 'ATIVO' ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="flex items-center justify-end gap-2">
                      <button (click)="openEdit(user)" class="btn-edit px-3 py-1.5 rounded-lg text-xs font-medium"
                        style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer; transition: border-color 0.15s">
                        ✏️ Editar
                      </button>
                      <button (click)="confirmDelete(user)" class="btn-delete px-3 py-1.5 rounded-lg text-xs font-medium"
                        style="background: rgba(239,68,68,0.1); color: var(--color-danger); border: 1px solid rgba(239,68,68,0.2); cursor: pointer; transition: background 0.15s">
                        🗑 Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="text-center py-14">
                    <div class="text-3xl mb-3">👥</div>
                    <div class="font-medium mb-1" style="color: var(--color-text-secondary)">
                      {{ searchText ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.' }}
                    </div>
                    @if (!searchText) {
                      <p class="text-sm" style="color: var(--color-text-muted)">
                        Clique em "Novo Usuário" para começar.
                      </p>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    <!-- Form Modal -->
    @if (showForm()) {
      <app-usuario-form
        [user]="editingUser()"
        (saved)="onFormSaved()"
        (closed)="showForm.set(false)"
      />
    }

    <!-- Delete Confirm Modal -->
    @if (deleteTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.75)">
        <div class="rounded-2xl w-full max-w-sm mx-4 p-6"
             style="background: var(--color-surface); border: 1px solid var(--color-border)">
          <div class="text-3xl mb-4 text-center">⚠️</div>
          <h3 class="text-lg font-semibold text-center mb-2" style="color: var(--color-text-primary)">Confirmar Exclusão</h3>
          <p class="text-sm text-center mb-6" style="color: var(--color-text-secondary)">
            Tem certeza que deseja excluir
            <strong style="color: var(--color-text-primary)">{{ deleteTarget()?.name }}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div class="flex gap-3">
            <button (click)="deleteTarget.set(null)"
              class="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border); cursor: pointer">
              Cancelar
            </button>
            <button (click)="executeDelete()" [disabled]="deleting()"
              class="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold"
              [style.opacity]="deleting() ? '0.7' : '1'"
              style="background: var(--color-danger); color: #fff; border: none; cursor: pointer">
              {{ deleting() ? 'Excluindo...' : 'Sim, Excluir' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class UsuarioList implements OnInit {
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  users = signal<User[]>([]);
  loading = signal(false);
  showForm = signal(false);
  editingUser = signal<User | null>(null);
  deleteTarget = signal<User | null>(null);
  deleting = signal(false);
  searchText = '';

  get filtered(): User[] {
    const q = this.searchText.toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(u =>
      (u.name  ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    );
  }

  get totalAtivos(): number {
    return this.users().filter(u => u.status === 'ATIVO').length;
  }

  get totalAdmins(): number {
    return this.users().filter(u => u.type === 'ADMIN').length;
  }

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.loading.set(true);
    try {
      this.users.set(await this.userService.listar());
    } catch {
      this.notify.error('Erro ao carregar usuários.');
    } finally {
      this.loading.set(false);
    }
  }

  openNew(): void {
    this.editingUser.set(null);
    this.showForm.set(true);
  }

  openEdit(user: User): void {
    this.editingUser.set({ ...user });
    this.showForm.set(true);
  }

  async onFormSaved(): Promise<void> {
    this.showForm.set(false);
    await this.loadUsers();
  }

  confirmDelete(user: User): void {
    this.deleteTarget.set(user);
  }

  async executeDelete(): Promise<void> {
    const user = this.deleteTarget();
    if (!user) return;
    this.deleting.set(true);
    try {
      await this.userService.excluir(user.id);
      this.notify.success('Usuário excluído com sucesso.');
      this.deleteTarget.set(null);
      await this.loadUsers();
    } catch {
      this.notify.error('Erro ao excluir usuário.');
    } finally {
      this.deleting.set(false);
    }
  }

  typeLabel(type: string): string {
    return Enums.userType.find(t => t.value === type)?.label ?? type;
  }

  typeBg(type: string): string {
    const map: Record<string, string> = {
      ADMIN:        'rgba(239,68,68,0.15)',
      ORGANIZADOR:  'rgba(6,182,212,0.15)',
      PARTICIPANTE: 'rgba(148,163,184,0.1)',
    };
    return map[type] ?? 'rgba(148,163,184,0.1)';
  }

  typeColor(type: string): string {
    const map: Record<string, string> = {
      ADMIN:        'var(--color-danger)',
      ORGANIZADOR:  'var(--color-primary)',
      PARTICIPANTE: 'var(--color-text-secondary)',
    };
    return map[type] ?? 'var(--color-text-secondary)';
  }

  initials(name: string): string {
    if (!name?.trim()) return '??';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
