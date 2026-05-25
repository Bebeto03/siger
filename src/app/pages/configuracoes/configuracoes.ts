import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { AuthService as AuthorizationService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../../shared/components/toast/toast';

type Tab = 'perfil' | 'seguranca' | 'notificacoes';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ToastComponent],
  templateUrl: './configuracoes.html'
})
export class Configuracoes implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  readonly auth = inject(AuthorizationService);
  private notify = inject(NotificationService);

  activeTab = signal<Tab>('perfil');
  loadingProfile = signal(false);
  savingProfile = signal(false);
  sendingReset = signal(false);
  resetSent = signal(false);
  currentUser = signal<User | null>(null);
  savingNotif = signal(false);

  readonly notifItems = [
    { key: 'lembretes',    label: 'Lembretes de reunião',          description: '24h e 1h antes do início da reunião' },
    { key: 'convites',     label: 'Convites de reunião',            description: 'Quando você for convidado para uma reunião' },
    { key: 'cancelamento', label: 'Cancelamento de reunião',        description: 'Quando uma reunião for cancelada' },
    { key: 'tarefas',      label: 'Atribuição de tarefas',          description: 'Quando uma tarefa for atribuída a você' },
    { key: 'ausencia',     label: 'Alertas de ausência de confirmação', description: 'Participantes que ainda não confirmaram presença' },
  ];

  notifValues: Record<string, boolean> = {
    lembretes:    true,
    convites:     true,
    cancelamento: true,
    tarefas:      true,
    ausencia:     false,
  };

  toggleNotif(key: string): void {
    this.notifValues[key] = !this.notifValues[key];
  }

  async saveNotifications(): Promise<void> {
    this.savingNotif.set(true);
    await new Promise(r => setTimeout(r, 600));
    this.savingNotif.set(false);
    this.notify.success('Preferências de notificação salvas.');
  }

  profileForm = this.fb.group({
    name:  ['', Validators.required],
    email: [''],
    cpf:   [''],
    phone: [''],
  });

  avatarInitials(): string {
    const name = this.currentUser()?.name || this.auth.getNomeUsuario();
    if (!name?.trim()) return '??';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  roleLabel(): string {
    const authorities = this.auth.currentUser()?.authorities ?? [];
    if (authorities.includes('ROLE_ADMIN'))        return 'Administrador';
    if (authorities.includes('ROLE_ORGANIZADOR'))  return 'Organizador';
    if (authorities.includes('ROLE_PARTICIPANTE')) return 'Participante';
    return 'Participante';
  }

  async ngOnInit(): Promise<void> {
    await this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.loadingProfile.set(true);
    try {
      const me = await this.userService.buscarMe();
      this.currentUser.set(me);
      this.profileForm.patchValue({
        name:  me.name  ?? '',
        email: me.email ?? '',
        cpf:   me.cpf   ?? '',
        phone: me.phone ?? '',
      });
    } catch {
      this.profileForm.patchValue({ email: this.auth.getNomeUsuario() });
    } finally {
      this.loadingProfile.set(false);
    }
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.savingProfile.set(true);
    try {
      const updated = await this.userService.alterarMe({
        name:  this.profileForm.get('name')?.value  ?? '',
        phone: this.profileForm.get('phone')?.value ?? undefined,
      });
      this.currentUser.set(updated);
      this.notify.success('Perfil atualizado com sucesso.');
    } catch {
      this.notify.error('Erro ao atualizar perfil.');
    } finally {
      this.savingProfile.set(false);
    }
  }

  async requestPasswordReset(): Promise<void> {
    this.sendingReset.set(true);
    try {
      await this.auth.forgotPassword(this.auth.getNomeUsuario());
      this.resetSent.set(true);
    } catch {
      this.notify.error('Erro ao enviar e-mail de redefinição.');
    } finally {
      this.sendingReset.set(false);
    }
  }

  profileHasError(field: string): boolean {
    const c = this.profileForm.get(field);
    return !!(c?.invalid && c?.touched);
  }

  inputStyle(hasErr: boolean): string {
    const border = hasErr ? 'var(--color-danger)' : 'var(--color-border)';
    return `background: var(--color-surface-light); border: 1px solid ${border}; color: var(--color-text-primary);`;
  }
}
