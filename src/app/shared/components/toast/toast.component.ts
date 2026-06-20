import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast toast--{{ toast.type }}"
          role="alert"
          (click)="toastService.dismiss(toast.id)"
        >
          <span class="toast__icon">{{ icons[toast.type] }}</span>
          <span class="toast__message">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 22rem;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1.125rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.4;
      cursor: pointer;
      pointer-events: all;
      color: #fff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      animation: toast-in 0.25s ease;
    }

    @keyframes toast-in {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }

    .toast--success { background: #10b981; }
    .toast--error   { background: #ef4444; }
    .toast--info    { background: #3b82f6; }
    .toast--warning { background: #f59e0b; }

    .toast__icon {
      font-size: 1rem;
      flex-shrink: 0;
      margin-top: 0.05rem;
    }

    .toast__message { flex: 1; }
  `],
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  readonly icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };
}
