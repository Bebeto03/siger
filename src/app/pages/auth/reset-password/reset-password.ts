import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../../../shared/components/toast/toast';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ToastComponent],
  template: `
    <app-toast />
    <div class="min-h-screen flex items-center justify-center p-6" style="background: var(--color-bg);">
      <div class="w-full max-w-md p-8 rounded-2xl" style="background: var(--color-surface); border: 1px solid var(--color-border);">
        <div class="w-12 h-12 rounded-xl mb-6 flex items-center justify-center font-black text-white text-xl"
             style="background: linear-gradient(135deg, #06B6D4, #0891B2);">S</div>
        <h2 class="text-2xl font-bold mb-1" style="color: var(--color-text-primary);">Nova senha</h2>
        <p class="text-sm mb-7" style="color: var(--color-text-muted);">Digite e confirme sua nova senha.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <label class="block text-xs font-semibold tracking-wide mb-1.5" style="color: var(--color-text-secondary);">NOVA SENHA</label>
          <input formControlName="newPassword" type="password" placeholder="Mínimo 8 caracteres"
            class="w-full px-4 py-2.5 rounded-lg text-sm mb-6"
            style="background: var(--color-surface-light); border: 1px solid var(--color-border); color: var(--color-text-primary);" />

          <button type="submit" [disabled]="loading()"
            class="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 border-none cursor-pointer mb-4"
            style="background: var(--color-primary);">
            {{ loading() ? 'Salvando...' : 'Redefinir senha' }}
          </button>
          <a routerLink="/login" class="block text-center text-sm" style="color: var(--color-primary);">Voltar ao login</a>
        </form>
      </div>
    </div>
  `
})
export class ResetPassword {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private notify = inject(NotificationService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  form = this.fb.group({ newPassword: ['', [Validators.required, Validators.minLength(8)]] });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.loading.set(true);
    try {
      await this.auth.resetPassword(token, this.form.value.newPassword!);
      this.notify.success('Senha redefinida com sucesso!');
      this.router.navigate(['/login']);
    } catch {
      this.notify.error('Link inválido ou expirado.');
    } finally {
      this.loading.set(false);
    }
  }
}
