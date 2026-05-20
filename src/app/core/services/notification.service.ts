import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private nextId = 0;

  success(message: string): void { this.add('success', message); }
  error(message: string): void   { this.add('error', message); }
  warning(message: string): void { this.add('warning', message); }
  info(message: string): void    { this.add('info', message); }

  remove(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(type: ToastType, message: string): void {
    const id = ++this.nextId;
    this._toasts.update(list => [...list, { id, type, message }]);
    setTimeout(() => this.remove(id), 4000);
  }
}
