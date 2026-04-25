import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ToastComponent],
  templateUrl: './login.html',
})
export class Login {
  private fb          = inject(FormBuilder);
  private auth        = inject(AuthService);
  private userService = inject(UserService);
  private router      = inject(Router);
  private notify      = inject(NotificationService);

  activeTab = signal<'login' | 'register'>('login');
  loading   = signal(false);
  showPass  = signal(false);

  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  registerForm = this.fb.group({
    name:     ['', Validators.required],
    cpf:      ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    type:     ['PARTICIPANTE', Validators.required],
  });

  readonly registerFields: { key: string; label: string; type: string; placeholder: string; error: string; maxLength?: number; iconPath: string; iconExtra?: string }[] = [
    { key: 'name',     label: 'NOME COMPLETO', type: 'text',     placeholder: 'João da Silva',       error: 'Nome obrigatório.',                    iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', iconExtra: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
    { key: 'cpf',      label: 'CPF',           type: 'text',     placeholder: '00000000000',          error: 'CPF deve ter 11 dígitos.',             iconPath: 'M1 4h22v16H1zM1 10h22', maxLength: 11 },
    { key: 'email',    label: 'E-MAIL',        type: 'email',    placeholder: 'seu@email.com',        error: 'E-mail inválido.',                     iconPath: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', iconExtra: 'M22 6 12 13 2 6' },
    { key: 'password', label: 'SENHA',         type: 'password', placeholder: 'Mínimo 8 caracteres', error: 'Senha deve ter no mínimo 8 caracteres.', iconPath: 'M7 11V7a5 5 0 0 1 10 0v4', iconExtra: 'M3 11h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  ];

  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.loading.set(true);
    try {
      await this.auth.login(this.loginForm.value as any);
      this.router.navigate(['/dashboard']);
    } catch {
      this.notify.error('E-mail ou senha inválidos.');
    } finally {
      this.loading.set(false);
    }
  }

  async onRegister(): Promise<void> {
    if (this.registerForm.invalid) { this.registerForm.markAllAsTouched(); return; }
    this.loading.set(true);
    try {
      await this.userService.register(this.registerForm.value as any);
      this.notify.success('Conta criada! Faça login para continuar.');
      this.activeTab.set('login');
      this.registerForm.reset({ type: 'PARTICIPANTE' });
    } catch {
      this.notify.error('Erro ao criar conta. Verifique os dados e tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }

  hasError(form: any, field: string): boolean {
    const c = form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
