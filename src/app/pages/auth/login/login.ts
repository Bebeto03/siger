import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from '../../../shared/components/toast/toast';
import { CommonModule } from '@angular/common';

function cpfValidator(control: AbstractControl): ValidationErrors | null {
  const c = (control.value ?? '').replace(/\D/g, '');
  if (!c) return null;
  if (c.length !== 11 || /^(.)\1{10}$/.test(c)) return { cpfInvalid: true };
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += +c[i] * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem >= 10) rem = 0;
  if (rem !== +c[9]) return { cpfInvalid: true };
  sum = 0;
  for (let i = 0; i < 10; i++) sum += +c[i] * (11 - i);
  rem = (sum * 10) % 11;
  if (rem >= 10) rem = 0;
  return rem !== +c[10] ? { cpfInvalid: true } : null;
}

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass    = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

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
    name:            ['', Validators.required],
    cpf:             ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11), cpfValidator]],
    phone:           ['', [Validators.minLength(10), Validators.maxLength(11)]],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    type:            ['PARTICIPANTE', Validators.required],
  }, { validators: passwordMatchValidator });

  readonly registerFields: {
    key: string; label: string; type: string; placeholder: string;
    error: string; maxLength?: number; iconPath: string; iconExtra?: string;
  }[] = [
    {
      key: 'name', label: 'NOME COMPLETO', type: 'text', placeholder: 'João da Silva',
      error: 'Nome obrigatório.',
      iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', iconExtra: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    },
    {
      key: 'cpf', label: 'CPF', type: 'text', placeholder: '00000000000',
      error: 'CPF inválido.', maxLength: 11,
      iconPath: 'M1 4h22v16H1zM1 10h22',
    },
    {
      key: 'phone', label: 'TELEFONE', type: 'text', placeholder: '11999999999',
      error: 'Telefone deve ter 10 ou 11 dígitos.', maxLength: 11,
      iconPath: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.46 2 2 0 0 1 3.59 2.23h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.81.7A2 2 0 0 1 21.73 17z',
    },
    {
      key: 'email', label: 'E-MAIL', type: 'email', placeholder: 'seu@email.com',
      error: 'E-mail inválido.',
      iconPath: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', iconExtra: 'M22 6 12 13 2 6',
    },
    {
      key: 'password', label: 'SENHA', type: 'password', placeholder: 'Mínimo 8 caracteres',
      error: 'Senha deve ter no mínimo 8 caracteres.',
      iconPath: 'M7 11V7a5 5 0 0 1 10 0v4', iconExtra: 'M3 11h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    },
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
      const { confirmPassword, ...payload } = this.registerForm.value as any;
      await this.userService.register(payload);
      this.notify.success('Conta criada! Faça login para continuar.');
      this.activeTab.set('login');
      this.registerForm.reset({ type: 'PARTICIPANTE' });
    } catch {
      this.notify.error('Erro ao criar conta. Verifique os dados e tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }

  hasError(form: AbstractControl, field: string): boolean {
    const c = form.get(field);
    if (field === 'confirmPassword') {
      return !!(c?.touched && (c?.invalid || form.hasError('passwordMismatch')));
    }
    return !!(c?.invalid && c?.touched);
  }

  confirmPasswordError(): string {
    const c = this.registerForm.get('confirmPassword');
    if (c?.touched) {
      if (c.hasError('required')) return 'Confirme sua senha.';
      if (this.registerForm.hasError('passwordMismatch')) return 'As senhas não coincidem.';
    }
    return '';
  }
}
