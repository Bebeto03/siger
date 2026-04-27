import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { UsuarioForm } from '../usuario-form/usuario-form';
import { Enums } from '../../../core/models/enums';

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
  templateUrl: 'usuario-list.html'
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

  private readonly gradients = [
    'linear-gradient(135deg, #6366F1, #8B5CF6)',
    'linear-gradient(135deg, #EC4899, #F43F5E)',
    'linear-gradient(135deg, #F59E0B, #D97706)',
    'linear-gradient(135deg, #10B981, #059669)',
    'linear-gradient(135deg, #EF4444, #DC2626)',
    'linear-gradient(135deg, #06B6D4, #0891B2)',
  ];

  avatarGradient(index: number): string {
    return this.gradients[index % this.gradients.length];
  }
}
