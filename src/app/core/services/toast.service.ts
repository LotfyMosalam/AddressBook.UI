import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private counter = 0;

  success(message: string, duration = 4000): void {
    this.add(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.add(message, 'error', duration);
  }

  info(message: string, duration = 4000): void {
    this.add(message, 'info', duration);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private add(message: string, type: ToastType, duration: number): void {
    const id = ++this.counter;
    this._toasts.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
