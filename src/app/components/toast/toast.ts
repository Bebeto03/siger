import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Toast } from '../../configuration/core/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      @for (toast of notify.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium animate-slide-in"
          [class]="toastClass(toast)"
        >
          <span class="text-lg leading-none mt-0.5">{{ toastIcon(toast.type) }}</span>
          <span class="flex-1">{{ toast.message }}</span>
          <button
            (click)="notify.remove(toast.id)"
            class="opacity-60 hover:opacity-100 transition-opacity leading-none text-base"
          >✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .animate-slide-in { animation: slide-in 0.25s ease; }
  `]
})
export class ToastComponent {
  readonly notify = inject(NotificationService);

  toastClass(toast: Toast): string {
    const map: Record<string, string> = {
      success: 'bg-emerald-900/90 border-emerald-500/40 text-emerald-100',
      error:   'bg-red-900/90 border-red-500/40 text-red-100',
      warning: 'bg-amber-900/90 border-amber-500/40 text-amber-100',
      info:    'bg-cyan-900/90 border-cyan-500/40 text-cyan-100',
    };
    return map[toast.type] ?? map['info'];
  }

  toastIcon(type: string): string {
    const map: Record<string, string> = {
      success: '✓', error: '✕', warning: '⚠', info: 'ℹ'
    };
    return map[type] ?? 'ℹ';
  }
}
