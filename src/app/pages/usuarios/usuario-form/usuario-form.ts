import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { Enums } from '../../../core/models/enums';

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
  if (!pass && !confirm) return null;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`.close-btn:hover { background: var(--color-surface-light) !important; }`],
  templateUrl: 'usuario-form.html'
})
export class UsuarioForm implements OnInit {
  private fb          = inject(FormBuilder);
  private userService = inject(UserService);
  private notify      = inject(NotificationService);

  user   = input<User | null>(null);
  saved  = output<void>();
  closed = output<void>();

  loading = signal(false);
  isEdit  = false;

  readonly userTypes    = Enums.userType;
  readonly userStatuses = Enums.userStatus;

  form = this.fb.group({
    name:            ['', [Validators.required, Validators.minLength(2)]],
    email:           ['', [Validators.required, Validators.email]],
    cpf:             ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11), cpfValidator]],
    phone:           ['', [Validators.minLength(10), Validators.maxLength(11)]],
    type:            ['PARTICIPANTE', Validators.required],
    status:          ['ATIVO', Validators.required],
    password:        [''],
    confirmPassword: [''],
  }, { validators: passwordMatchValidator });

  ngOnInit(): void {
    const u = this.user();
    if (u) {
      this.isEdit = true;
      this.form.patchValue({
        name:   u.name   ?? '',
        email:  u.email  ?? '',
        cpf:    u.cpf    ?? '',
        phone:  u.phone  ?? '',
        type:   u.type   ?? 'PARTICIPANTE',
        status: u.status ?? 'ATIVO',
      });
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('confirmPassword')?.setValidators([Validators.required]);
      this.form.get('confirmPassword')?.updateValueAndValidity();
    }
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    try {
      const { confirmPassword, ...data } = this.form.value as any;
      if (this.isEdit) {
        if (!data.password) delete data.password;
        await this.userService.alterar({ ...this.user()!, ...data } as User);
        this.notify.success('Usuário atualizado com sucesso.');
      } else {
        await this.userService.incluir(data as User);
        this.notify.success('Usuário criado com sucesso.');
      }
      this.saved.emit();
    } catch {
      this.notify.error('Erro ao salvar usuário. Verifique os dados e tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    if (field === 'confirmPassword') {
      return !!(c?.touched && (c?.invalid || this.form.hasError('passwordMismatch')));
    }
    return !!(c?.invalid && c?.touched);
  }

  cpfError(): string {
    const c = this.form.get('cpf');
    if (c?.touched && c?.invalid) {
      if (c.hasError('required'))                          return 'CPF é obrigatório.';
      if (c.hasError('minlength') || c.hasError('maxlength')) return 'CPF deve ter 11 dígitos.';
      if (c.hasError('cpfInvalid'))                        return 'CPF inválido.';
    }
    return '';
  }

  confirmPasswordError(): string {
    const c = this.form.get('confirmPassword');
    if (c?.touched) {
      if (c.hasError('required'))                      return 'Confirme a senha.';
      if (this.form.hasError('passwordMismatch')) return 'As senhas não coincidem.';
    }
    return '';
  }

  inputStyle(hasErr: boolean): string {
    const border = hasErr ? 'var(--color-danger)' : 'var(--color-border)';
    return `background: var(--color-surface-light); border: 1px solid ${border}; color: var(--color-text-primary);`;
  }
}
