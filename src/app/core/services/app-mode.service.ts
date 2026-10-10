import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'appMode';

@Injectable({ providedIn: 'root' })
export class AppModeService {
  private readonly _mode = signal<0 | 1>(this.readStored());

  readonly mode = this._mode.asReadonly();

  get isLive(): boolean {
    return this._mode() === 1;
  }

  toggle(): void {
    const next = this._mode() === 0 ? 1 : 0;
    localStorage.setItem(STORAGE_KEY, String(next));
    window.location.reload();
  }

  private readStored(): 0 | 1 {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1' ? 1 : 0;
    } catch {
      return 0;
    }
  }
}
