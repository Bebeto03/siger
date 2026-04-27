import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { Enums } from '../../../core/models/enums';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`.close-btn:hover { background: var(--color-surface-light) !important; }`],
  templateUrl: 'usuario-form.html'
})
export class UsuarioForm implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private notify = inject(NotificationService);

  user = input<User | null>(null);
  saved = output<void>();
  closed = output<void>();

  loading = signal(false);
  isEdit = false;

  readonly userTypes = Enums.userType;
  readonly userStatuses = Enums.userStatus;

  form = this.fb.group({
    name:     ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    cpf:      ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    phone:    [''],
    type:     ['PARTICIPANTE', Validators.required],
    status:   ['ATIVO', Validators.required],
    password: [''],
  });

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
    }
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    try {
      const data: any = { ...this.form.value };
      if (this.isEdit) {
        if (!data.password) delete data.password;
        const u = this.user()!;
        await this.userService.alterar({ ...u, ...data } as User);
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
    return !!(c?.invalid && c?.touched);
  }

  inputStyle(hasErr: boolean): string {
    const border = hasErr ? 'var(--color-danger)' : 'var(--color-border)';
    return `background: var(--color-surface-light); border: 1px solid ${border}; color: var(--color-text-primary);`;
  }
}
