import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { PageFooterComponent } from '../../../../shared/components/page-footer/page-footer.component';
import { ApiKeyData } from '../../data/api-key.models';
import { ApiKeyService } from '../../data/api-key.service';

@Component({
  selector: 'app-api-key-home-page',
  standalone: true,
  imports: [CommonModule, PageFooterComponent],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-3">
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5">
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Developer</p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            API Keys
          </h1>
        </div>
      </div>

      <article *ngIf="isLoading()" class="p-6">
        <p class="m-0 text-sm text-[#61708a]">Loading API keys...</p>
      </article>

      <article *ngIf="!isLoading() && errorMessage()" class="rounded-2xl border border-[#ffd7d3] bg-[#fff6f5] p-6">
        <p class="m-0 text-sm font-medium text-[#b42318]">{{ errorMessage() }}</p>
      </article>

      <section *ngIf="!isLoading() && !errorMessage() && keys()" class="grid gap-4 md:grid-cols-2">

        <div class="grid gap-3 rounded-[1.4rem] border border-[rgba(138,158,191,0.18)] bg-white p-5 shadow-[0_8px_24px_rgba(48,72,112,0.06)]">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#fef9ec]">
              <svg class="h-4 w-4 text-[#b45309]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
            </span>
            <div>
              <p class="m-0 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#91a0bb]">Test API Key</p>
              <p class="m-0 text-[0.8rem] text-[#607089]">Use in sandbox / testing</p>
            </div>
            <span class="ml-auto inline-flex items-center rounded-full border border-[#fde68a] bg-[#fef9ec] px-2.5 py-0.5 text-[0.7rem] font-bold text-[#b45309]">TEST</span>
          </div>

          <div class="flex items-center gap-2 rounded-xl border border-[rgba(138,158,191,0.2)] bg-[#f8fbff] px-4 py-3">
            <code class="min-w-0 flex-1 truncate font-mono text-[0.82rem] text-[#2a3340]" [title]="keys()!.testApiKey ?? ''">
              {{ revealTest() ? (keys()!.testApiKey || '—') : maskKey(keys()!.testApiKey) }}
            </code>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-[rgba(138,158,191,0.24)] bg-white px-2.5 py-1.5 text-[0.72rem] font-semibold text-[#52627c] transition hover:bg-[#f0f4f9]"
              (click)="revealTest.set(!revealTest())"
            >
              {{ revealTest() ? 'Hide' : 'Show' }}
            </button>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-[rgba(138,158,191,0.24)] bg-white px-2.5 py-1.5 text-[0.72rem] font-semibold transition"
              [class]="copied() === 'test' ? 'border-[#fde68a] bg-[#fef9ec] text-[#b45309]' : 'text-[#52627c] hover:bg-[#f0f4f9]'"
              (click)="copy(keys()!.testApiKey, 'test')"
            >
              {{ copied() === 'test' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <div class="grid gap-3 rounded-[1.4rem] border border-[rgba(138,158,191,0.18)] bg-white p-5 shadow-[0_8px_24px_rgba(48,72,112,0.06)]">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f0fdf4]">
              <svg class="h-4 w-4 text-[#16a34a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
            </span>
            <div>
              <p class="m-0 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#91a0bb]">Live API Key</p>
              <p class="m-0 text-[0.8rem] text-[#607089]">Use in production</p>
            </div>
            <span class="ml-auto inline-flex items-center rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-0.5 text-[0.7rem] font-bold text-[#16a34a]">LIVE</span>
          </div>

          <div class="flex items-center gap-2 rounded-xl border border-[rgba(138,158,191,0.2)] bg-[#f8fbff] px-4 py-3">
            <code class="min-w-0 flex-1 truncate font-mono text-[0.82rem] text-[#2a3340]" [title]="keys()!.apiKey ?? ''">
              {{ revealLive() ? (keys()!.apiKey || '—') : maskKey(keys()!.apiKey) }}
            </code>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-[rgba(138,158,191,0.24)] bg-white px-2.5 py-1.5 text-[0.72rem] font-semibold text-[#52627c] transition hover:bg-[#f0f4f9]"
              (click)="revealLive.set(!revealLive())"
            >
              {{ revealLive() ? 'Hide' : 'Show' }}
            </button>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-[rgba(138,158,191,0.24)] bg-white px-2.5 py-1.5 text-[0.72rem] font-semibold transition"
              [class]="copied() === 'live' ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]' : 'text-[#52627c] hover:bg-[#f0f4f9]'"
              (click)="copy(keys()!.apiKey, 'live')"
            >
              {{ copied() === 'live' ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

      </section>

      <app-page-footer />
    </main>
  `
})
export class ApiKeyHomePageComponent {
  private readonly apiKeyService = inject(ApiKeyService);

  protected readonly keys = signal<ApiKeyData | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly copied = signal('');
  protected readonly revealLive = signal(false);
  protected readonly revealTest = signal(false);

  constructor() {
    this.loadKeys();
  }

  private loadKeys(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.apiKeyService
      .getKeys()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => this.keys.set(data),
        error: (error: unknown) => this.errorMessage.set(this.resolveError(error))
      });
  }

  protected maskKey(value: string | null | undefined): string {
    if (!value) return '—';
    return value.slice(0, 6) + '••••••••••••';
  }

  protected copy(value: string | null | undefined, target: string): void {
    if (!value) return;
    void navigator.clipboard.writeText(value).then(() => {
      this.copied.set(target);
      setTimeout(() => {
        if (this.copied() === target) this.copied.set('');
      }, 2000);
    });
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
      if (error.status === 401) return 'Session expired. Please sign in again.';
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return 'Unable to load API keys right now.';
  }
}
