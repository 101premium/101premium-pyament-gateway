import { Injectable, signal } from '@angular/core';

export type ToastKind = 'error' | 'success' | 'info';

export interface Toast {
  message: string;
  kind: ToastKind;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly current = signal<Toast | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;

  show(message: string, kind: ToastKind = 'error', durationMs = 3500): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }

    this.current.set({ message, kind });

    this.timer = setTimeout(() => {
      this.current.set(null);
      this.timer = null;
    }, durationMs);
  }

  dismiss(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.current.set(null);
  }
}
