import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../model/user';
import { NotificationService } from '../../configuration/core/notification.service';
import { Enums } from '../../model/enums';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`.close-btn:hover { background: var(--color-surface-light) !important; }`],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center" style="background: rgba(0,0,0,0.75)">
      <div class="rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
           style="background: var(--color-surface); border: 1px solid var(--color-border)">

        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b" style="border-color: var(--color-border)">
          <h2 class="text-lg font-semibold" style="color: var(--color-text-primary)">
            {{ isEdit ? 'Editar Usuário' : 'Novo Usuário' }}
          </h2>
          <button (click)="closed.emit()"
            class="close-btn w-8 h-8 flex items-center justify-center rounded-lg text-sm"
            style="color: var(--color-text-muted); background: transparent; border: none; cursor: pointer">✕</button>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSave()" class="p-6 flex flex-col gap-4">

          <!-- Nome -->
          <div>
            <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                   style="color: var(--color-text-muted)">Nome Completo *</label>
            <input formControlName="name" type="text" placeholder="João da Silva"
              class="w-full px-3 py-2.5 rounded-lg text-sm transition-colors"
              [style]="inputStyle(hasError('name'))" />
            @if (hasError('name')) {
              <span class="text-xs mt-1 block" style="color: var(--color-danger)">Nome é obrigatório.</span>
            }
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                   style="color: var(--color-text-muted)">E-mail *</label>
            <input formControlName="email" type="email" placeholder="seu@email.com"
              class="w-full px-3 py-2.5 rounded-lg text-sm"
              [style]="inputStyle(hasError('email'))" />
            @if (hasError('email')) {
              <span class="text-xs mt-1 block" style="color: var(--color-danger)">E-mail inválido.</span>
            }
          </div>

          <!-- CPF + Telefone -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                     style="color: var(--color-text-muted)">CPF *</label>
              <input formControlName="cpf" type="text" placeholder="00000000000" maxlength="11"
                class="w-full px-3 py-2.5 rounded-lg text-sm"
                [style]="inputStyle(hasError('cpf'))" />
              @if (hasError('cpf')) {
                <span class="text-xs mt-1 block" style="color: var(--color-danger)">CPF deve ter 11 dígitos.</span>
              }
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                     style="color: var(--color-text-muted)">Telefone</label>
              <input formControlName="phone" type="text" placeholder="(11) 99999-9999"
                class="w-full px-3 py-2.5 rounded-lg text-sm"
                [style]="inputStyle(false)" />
            </div>
          </div>

          <!-- Tipo + Status -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                     style="color: var(--color-text-muted)">Tipo *</label>
              <select formControlName="type" class="w-full px-3 py-2.5 rounded-lg text-sm"
                      [style]="inputStyle(false)">
                @for (t of userTypes; track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                     style="color: var(--color-text-muted)">Status *</label>
              <select formControlName="status" class="w-full px-3 py-2.5 rounded-lg text-sm"
                      [style]="inputStyle(false)">
                @for (s of userStatuses; track s.value) {
                  <option [value]="s.value">{{ s.label }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Senha -->
          <div>
            <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                   style="color: var(--color-text-muted)">
              {{ isEdit ? 'Nova Senha (deixe em branco para manter)' : 'Senha *' }}
            </label>
            <input formControlName="password" type="password"
              placeholder="{{ isEdit ? 'Nova senha (opcional)' : 'Mínimo 8 caracteres' }}"
              class="w-full px-3 py-2.5 rounded-lg text-sm"
              [style]="inputStyle(hasError('password'))" />
            @if (hasError('password')) {
              <span class="text-xs mt-1 block" style="color: var(--color-danger)">
                Senha deve ter no mínimo 8 caracteres.
              </span>
            }
          </div>

          <!-- Ações -->
          <div class="flex gap-3 justify-end pt-2 border-t mt-2" style="border-color: var(--color-border)">
            <button type="button" (click)="closed.emit()"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style="background: var(--color-surface-light); color: var(--color-text-secondary); border: 1px solid var(--color-border)">
              Cancelar
            </button>
            <button type="submit" [disabled]="loading()"
              class="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              [style]="loading() ? 'background: var(--color-primary-dark); color: #000; opacity: 0.7; cursor: not-allowed'
                                 : 'background: var(--color-primary); color: #000'">
              {{ loading() ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Usuário') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
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
