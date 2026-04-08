import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, output, signal, viewChild } from '@angular/core';
import { finalize } from 'rxjs';
import { HelpAiService } from '../../services/help-ai.service';

@Component({
  selector: 'app-help-ai-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="help-ai-backdrop"
      role="presentation"
      (click)="onBackdropClick($event)"
    ></div>
    <aside
      class="help-ai-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-ai-title"
      aria-describedby="help-ai-desc"
    >
      <header class="help-ai-header">
        <div>
          <h2 id="help-ai-title" class="help-ai-title">Ask AI</h2>
          <p id="help-ai-desc" class="help-ai-sub">
            Help Center
            <span *ngIf="helpAi.usesRemote()" class="help-ai-badge">Live</span>
            <span *ngIf="!helpAi.usesRemote()" class="help-ai-badge help-ai-badge--local">Guide</span>
          </p>
        </div>
        <button type="button" class="help-ai-close" (click)="close()" aria-label="Close help">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </button>
      </header>

      <div #scroll class="help-ai-messages" tabindex="-1">
        @for (m of messages(); track $index) {
          <div class="help-ai-msg" [class.help-ai-msg--user]="m.role === 'user'">
            <span class="help-ai-msg__label">{{ m.role === 'user' ? 'You' : 'Assistant' }}</span>
            <p class="help-ai-msg__text">{{ m.text }}</p>
          </div>
        }
        @if (isLoading()) {
          <div class="help-ai-msg help-ai-msg--pending">
            <span class="help-ai-msg__label">Assistant</span>
            <p class="help-ai-msg__text help-ai-typing">Thinking…</p>
          </div>
        }
      </div>

      <form class="help-ai-form" (submit)="$event.preventDefault(); send()">
        <label class="sr-only" for="help-ai-input">Your question</label>
        <input
          id="help-ai-input"
          type="text"
          class="help-ai-input"
          placeholder="Ask about payments, teams, settings…"
          [value]="draft()"
          (input)="draft.set($any($event.target).value)"
          autocomplete="off"
        />
        <button type="submit" class="help-ai-send" [disabled]="isLoading() || !draft().trim()">Send</button>
      </form>
    </aside>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 80;
      display: grid;
      grid-template-columns: 1fr minmax(0, 420px);
      pointer-events: none;
    }

    .help-ai-backdrop {
      pointer-events: auto;
      background: rgba(30, 42, 62, 0.35);
      backdrop-filter: blur(2px);
    }

    .help-ai-drawer {
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      max-height: 100%;
      background: rgba(255, 255, 255, 0.98);
      border-left: 1px solid rgba(138, 158, 191, 0.2);
      box-shadow: -12px 0 40px rgba(48, 72, 112, 0.12);
    }

    .help-ai-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem 1.25rem 1rem;
      border-bottom: 1px solid rgba(138, 158, 191, 0.16);
    }

    .help-ai-title {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: #1d2a44;
      letter-spacing: -0.02em;
    }

    .help-ai-sub {
      margin: 0.35rem 0 0;
      font-size: 0.85rem;
      color: #7a8aa3;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem;
    }

    .help-ai-badge {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--primary) 12%, transparent);
      color: var(--primary);
    }

    .help-ai-badge--local {
      background: rgba(95, 120, 150, 0.12);
      color: #5d6d88;
    }

    .help-ai-close {
      border: 0;
      background: rgba(138, 158, 191, 0.12);
      color: #5d6d88;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 999px;
      cursor: pointer;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .help-ai-close:hover {
      background: color-mix(in srgb, var(--primary) 10%, transparent);
      color: var(--primary);
    }

    .help-ai-messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .help-ai-msg {
      padding: 0.75rem 0.95rem;
      border-radius: 1rem;
      background: rgba(238, 242, 248, 0.95);
      border: 1px solid rgba(138, 158, 191, 0.14);
    }

    .help-ai-msg--user {
      background: color-mix(in srgb, var(--primary) 8%, transparent);
      border-color: color-mix(in srgb, var(--primary) 15%, transparent);
    }

    .help-ai-msg--pending {
      opacity: 0.85;
    }

    .help-ai-msg__label {
      display: block;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #91a0bb;
      margin-bottom: 0.35rem;
    }

    .help-ai-msg__text {
      margin: 0;
      font-size: 0.92rem;
      line-height: 1.5;
      color: #2a3340;
      white-space: pre-wrap;
    }

    .help-ai-typing {
      font-style: italic;
      color: #7a8aa3;
    }

    .help-ai-form {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.25rem 1.25rem;
      border-top: 1px solid rgba(138, 158, 191, 0.16);
    }

    .help-ai-input {
      flex: 1;
      min-width: 0;
      min-height: 2.75rem;
      padding: 0 1rem;
      border-radius: 999px;
      border: 1px solid rgba(138, 158, 191, 0.35);
      font-size: 0.92rem;
      color: #2a3340;
      background: #fff;
    }

    .help-ai-input:focus {
      outline: 2px solid color-mix(in srgb, var(--primary) 30%, transparent);
      outline-offset: 1px;
    }

    .help-ai-send {
      flex-shrink: 0;
      min-height: 2.75rem;
      padding: 0 1.15rem;
      border: 0;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 8px 18px color-mix(in srgb, var(--primary) 24%, transparent);
    }

    .help-ai-send:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      box-shadow: none;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (max-width: 640px) {
      :host {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr auto;
      }

      .help-ai-backdrop {
        grid-row: 1;
      }

      .help-ai-drawer {
        grid-row: 2;
        max-height: min(70dvh, 520px);
        border-left: 0;
        border-top: 1px solid rgba(138, 158, 191, 0.2);
      }
    }
  `
})
export class HelpAiPanelComponent {
  readonly dismiss = output<void>();
  protected readonly helpAi = inject(HelpAiService);

  private readonly scrollEl = viewChild<ElementRef<HTMLElement>>('scroll');

  protected readonly messages = signal<{ role: 'user' | 'assistant'; text: string }[]>([
    {
      role: 'assistant',
      text:
        'Ask anything about using 101Premium: payments, teams, audit trail, settings, passwords, or search. ' +
        'I can answer from a built-in guide, or your workspace can connect a live AI endpoint in environment.helpAiChatUrl.'
    }
  ]);
  protected readonly draft = signal('');
  protected readonly isLoading = signal(false);

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected close(): void {
    this.dismiss.emit();
  }

  protected send(): void {
    const text = this.draft().trim();
    if (!text || this.isLoading()) {
      return;
    }

    this.draft.set('');
    this.messages.update((list) => [...list, { role: 'user', text }]);
    this.isLoading.set(true);
    this.queueScrollBottom();

    this.helpAi
      .ask(text)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((reply) => {
        const out = reply.trim() || 'I did not get a reply. Please try again.';
        this.messages.update((list) => [...list, { role: 'assistant', text: out }]);
        this.queueScrollBottom();
      });
  }

  private queueScrollBottom(): void {
    queueMicrotask(() => {
      const el = this.scrollEl()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}
