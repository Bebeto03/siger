import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';
import { AuthService as AuthorizationService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationPreferenceService } from '../../core/services/notification-preference.service';
import { NotificationPreference, NotificationPreferenceItem, NotificationType } from '../../core/models/notification-preference.model';
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
  private preferenceService = inject(NotificationPreferenceService);

  activeTab = signal<Tab>('perfil');
  loadingProfile = signal(false);
  savingProfile = signal(false);
  sendingReset = signal(false);
  resetSent = signal(false);
  currentUser = signal<User | null>(null);
  loadingNotif = signal(false);
  notifLoadError = signal(false);
  savingNotif = signal(false);
  notifPrefs = signal<NotificationPreference[]>([]);
  private savedNotifPrefs = signal<NotificationPreference[]>([]);

  // Rótulo vem do backend (description); aqui só o complemento explicativo de cada tipo.
  readonly notifHints: Record<NotificationType, string> = {
    MEETING_REMINDER:          '24h e 1h antes do início da reunião',
    MEETING_INVITE:            'Obrigatório: é pelo e-mail de convite que você confirma presença',
    MEETING_CANCELLED:         'Quando uma reunião da qual você participa for cancelada',
    TASK_ASSIGNED:             'Quando uma tarefa for atribuída a você',
    ORGANIZER_NO_CONFIRMATION: '1h antes da reunião, quando nenhum participante confirmou presença',
  };

  /** Apenas os tipos editáveis cujo valor difere do último estado salvo — o PUT é parcial. */
  changedNotifPrefs = computed<NotificationPreferenceItem[]>(() => {
    const saved = new Map(this.savedNotifPrefs().map(p => [p.type, p.emailEnabled]));
    return this.notifPrefs()
      .filter(p => p.editable && saved.get(p.type) !== p.emailEnabled)
      .map(p => ({ type: p.type, emailEnabled: p.emailEnabled }));
  });

  async openNotificationsTab(): Promise<void> {
    this.activeTab.set('notificacoes');
    if (this.savedNotifPrefs().length === 0 && !this.loadingNotif()) {
      await this.loadNotifications();
    }
  }

  async loadNotifications(): Promise<void> {
    this.loadingNotif.set(true);
    this.notifLoadError.set(false);
    try {
      this.applyNotifPrefs(await this.preferenceService.buscarMinhas());
    } catch {
      this.notifLoadError.set(true);
    } finally {
      this.loadingNotif.set(false);
    }
  }

  toggleNotif(pref: NotificationPreference): void {
    if (!pref.editable || this.savingNotif()) return;
    this.notifPrefs.update(list =>
      list.map(p => p.type === pref.type ? { ...p, emailEnabled: !p.emailEnabled } : p));
  }

  async saveNotifications(): Promise<void> {
    const changed = this.changedNotifPrefs();
    if (changed.length === 0) return;
    this.savingNotif.set(true);
    try {
      this.applyNotifPrefs(await this.preferenceService.salvarMinhas(changed));
      this.notify.success('Preferências de notificação salvas.');
    } catch (err) {
      // O interceptor já avisa em 400/404/5xx/sem conexão; o 403 (erro mascarado pelo backend) chega aqui sem aviso.
      if (err instanceof HttpErrorResponse && err.status === 403) {
        this.notify.error('Não foi possível salvar as preferências. Tente novamente.');
      }
    } finally {
      this.savingNotif.set(false);
    }
  }

  private applyNotifPrefs(prefs: NotificationPreference[]): void {
    this.savedNotifPrefs.set(prefs);
    this.notifPrefs.set(prefs);
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
