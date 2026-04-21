import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../model/user';
import { AuthorizationService } from '../../configuration/security/authorization.service';
import { NotificationService } from '../../configuration/core/notification.service';
import { ToastComponent } from '../../components/toast/toast';

type Tab = 'perfil' | 'seguranca';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ToastComponent],
  template: `
    <div class="flex flex-col gap-6 p-6 max-w-2xl">
      <app-toast />

      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">Configurações</h1>
        <p class="text-sm mt-1" style="color: var(--color-text-muted)">Gerencie seu perfil e preferências</p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 rounded-xl w-fit"
           style="background: var(--color-surface); border: 1px solid var(--color-border)">
        <button (click)="activeTab.set('perfil')"
          class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
          [style]="activeTab() === 'perfil'
            ? 'background: var(--color-primary); color: #000'
            : 'background: transparent; color: var(--color-text-secondary)'">
          👤 Meu Perfil
        </button>
        <button (click)="activeTab.set('seguranca')"
          class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
          [style]="activeTab() === 'seguranca'
            ? 'background: var(--color-primary); color: #000'
            : 'background: transparent; color: var(--color-text-secondary)'">
          🔒 Segurança
        </button>
      </div>

      <!-- Tab: Perfil -->
      @if (activeTab() === 'perfil') {
        <div class="rounded-xl p-6"
             style="background: var(--color-surface); border: 1px solid var(--color-border)">

          <!-- Avatar -->
          <div class="flex items-center gap-4 mb-6 pb-6 border-b" style="border-color: var(--color-border)">
            <div class="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                 style="background: linear-gradient(135deg, #6366F1, #8B5CF6)">
              {{ avatarInitials() }}
            </div>
            <div>
              <div class="font-semibold text-lg" style="color: var(--color-text-primary)">
                {{ currentUser()?.name || auth.getNomeUsuario() }}
              </div>
              <div class="text-sm mt-0.5" style="color: var(--color-text-muted)">
                {{ roleLabel() }}
              </div>
            </div>
          </div>

          @if (loadingProfile()) {
            <div class="flex items-center justify-center py-8 gap-3">
              <div class="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                   style="border-color: var(--color-primary); border-top-color: transparent"></div>
              <span class="text-sm" style="color: var(--color-text-muted)">Carregando perfil...</span>
            </div>
          } @else {
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="flex flex-col gap-4">

              <!-- Nome -->
              <div>
                <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                       style="color: var(--color-text-muted)">Nome Completo *</label>
                <input formControlName="name" type="text" placeholder="Seu nome"
                  class="w-full px-3 py-2.5 rounded-lg text-sm"
                  [style]="inputStyle(profileHasError('name'))" />
                @if (profileHasError('name')) {
                  <span class="text-xs mt-1 block" style="color: var(--color-danger)">Nome é obrigatório.</span>
                }
              </div>

              <!-- Email (readonly) -->
              <div>
                <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                       style="color: var(--color-text-muted)">E-mail</label>
                <input formControlName="email" type="email" readonly
                  class="w-full px-3 py-2.5 rounded-lg text-sm"
                  style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-muted); cursor: not-allowed" />
                <span class="text-xs mt-1 block" style="color: var(--color-text-muted)">
                  O e-mail não pode ser alterado.
                </span>
              </div>

              <!-- CPF + Telefone -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                         style="color: var(--color-text-muted)">CPF</label>
                  <input formControlName="cpf" type="text" maxlength="11" readonly
                    class="w-full px-3 py-2.5 rounded-lg text-sm"
                    style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-muted); cursor: not-allowed" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                         style="color: var(--color-text-muted)">Telefone</label>
                  <input formControlName="phone" type="text" placeholder="(11) 99999-9999"
                    class="w-full px-3 py-2.5 rounded-lg text-sm"
                    [style]="inputStyle(false)" />
                </div>
              </div>

              @if (!currentUser()) {
                <div class="rounded-lg px-4 py-3 text-sm"
                     style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: var(--color-warning)">
                  ⚠️ Sem permissão para carregar dados do perfil. Apenas administradores podem editar o perfil completo.
                </div>
              }

              <div class="pt-2 flex justify-end">
                <button type="submit" [disabled]="savingProfile() || !currentUser()"
                  class="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  [style]="(savingProfile() || !currentUser())
                    ? 'background: var(--color-primary-dark); color: #000; opacity: 0.5; cursor: not-allowed'
                    : 'background: var(--color-primary); color: #000'">
                  {{ savingProfile() ? 'Salvando...' : 'Salvar Perfil' }}
                </button>
              </div>
            </form>
          }
        </div>
      }

      <!-- Tab: Segurança -->
      @if (activeTab() === 'seguranca') {
        <div class="rounded-xl p-6"
             style="background: var(--color-surface); border: 1px solid var(--color-border)">
          <h3 class="font-semibold mb-1" style="color: var(--color-text-primary)">Alterar Senha</h3>
          <p class="text-sm mb-4" style="color: var(--color-text-muted)">
            Para alterar sua senha, utilizamos o fluxo seguro de redefinição por e-mail.
          </p>

          <div class="rounded-xl p-5"
               style="background: var(--color-surface-light); border: 1px solid var(--color-border)">
            <div class="flex items-start gap-4">
              <div class="text-2xl shrink-0">🔐</div>
              <div class="flex-1">
                <div class="font-medium mb-1" style="color: var(--color-text-primary)">
                  Redefinição de senha por e-mail
                </div>
                <p class="text-sm mb-4" style="color: var(--color-text-muted)">
                  Enviaremos um link de redefinição para
                  <strong style="color: var(--color-text-secondary)">{{ auth.getNomeUsuario() }}</strong>.
                  Verifique sua caixa de entrada.
                </p>
                <button (click)="requestPasswordReset()" [disabled]="sendingReset()"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  [style]="sendingReset()
                    ? 'background: var(--color-primary-dark); color: #000; opacity: 0.7; cursor: not-allowed'
                    : 'background: var(--color-primary); color: #000'">
                  {{ sendingReset() ? 'Enviando...' : '📧 Enviar link de redefinição' }}
                </button>
              </div>
            </div>
          </div>

          @if (resetSent()) {
            <div class="mt-4 rounded-lg px-4 py-3 text-sm flex items-center gap-2"
                 style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: var(--color-success)">
              ✓ E-mail de redefinição enviado! Verifique sua caixa de entrada.
            </div>
          }
        </div>
      }
    </div>
  `
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
    if (authorities.includes('ROLE_ADMIN')) return 'Administrador';
    if (authorities.includes('ROLE_ORGANIZADOR')) return 'Organizador';
    return 'Participante';
  }

  async ngOnInit(): Promise<void> {
    await this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.loadingProfile.set(true);
    try {
      // Tenta carregar usuários e encontrar o próprio por email (funciona para ADMIN)
      const myEmail = this.auth.getNomeUsuario();
      const users = await this.userService.listar();
      const me = users.find(u => u.email === myEmail) ?? null;
      this.currentUser.set(me);
      if (me) {
        this.profileForm.patchValue({
          name:  me.name  ?? '',
          email: me.email ?? '',
          cpf:   me.cpf   ?? '',
          phone: me.phone ?? '',
        });
      } else {
        this.profileForm.patchValue({ email: myEmail });
      }
    } catch {
      // Sem permissão - mostra apenas o que temos do JWT
      this.profileForm.patchValue({ email: this.auth.getNomeUsuario() });
    } finally {
      this.loadingProfile.set(false);
    }
  }

  async saveProfile(): Promise<void> {
    const user = this.currentUser();
    if (!user || this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.savingProfile.set(true);
    try {
      const updated = await this.userService.alterar({
        ...user,
        name:  this.profileForm.get('name')?.value  ?? user.name,
        phone: this.profileForm.get('phone')?.value ?? user.phone,
      } as User);
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
