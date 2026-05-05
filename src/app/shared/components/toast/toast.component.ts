import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (toast.current()) {
      <div
        role="alert"
        aria-live="assertive"
        class="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-[0_8px_32px_rgba(15,23,42,0.18)] transition-all"
        [class]="kindClass()"
      >
        <svg
          *ngIf="toast.current()!.kind === 'error'"
          class="h-5 w-5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
        <span>{{ toast.current()!.message }}</span>
        <button
          type="button"
          class="ml-1 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
          (click)="toast.dismiss()"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    }
  `
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);

  protected kindClass(): string {
    const kind = this.toast.current()?.kind;
    if (kind === 'error') return 'bg-[#b42318] text-white';
    if (kind === 'success') return 'bg-[#1c7f3d] text-white';
    return 'bg-[#1d2a44] text-white';
  }
}
