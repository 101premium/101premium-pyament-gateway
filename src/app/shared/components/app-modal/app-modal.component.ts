import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-50 grid place-items-center bg-[rgba(15,23,42,0.42)] px-4 py-6 backdrop-blur-[2px]"
      role="presentation"
      (click)="close()"
    >
      <section
        class="w-full max-w-[34rem] rounded-[1.5rem] bg-white p-0 text-left shadow-[0_30px_80px_rgba(15,23,42,0.24)]"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId()"
        (click)="$event.stopPropagation()"
      >
        <header class="flex items-start justify-between gap-4 border-b border-[rgba(138,158,191,0.16)] px-6 py-5">
          <div class="grid gap-1">
            <p
              *ngIf="eyebrow()"
              class="m-0 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#8fa0b8]"
            >
              {{ eyebrow() }}
            </p>
            <h2 [id]="titleId()" class="m-0 text-xl font-bold tracking-[-0.02em] text-[#2f3743]">
              {{ title() }}
            </h2>
          </div>

          <button
            type="button"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[rgba(138,158,191,0.2)] bg-white text-[#667792] transition hover:bg-[#f5f7fb] hover:text-[#16a34a]"
            [attr.aria-label]="closeLabel()"
            (click)="close()"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <div class="px-6 py-5">
          <ng-content />
        </div>

        <footer
          *ngIf="showActions()"
          class="flex flex-wrap justify-end gap-3 border-t border-[rgba(138,158,191,0.16)] px-6 py-4"
        >
          <ng-content select="[modal-actions]" />
        </footer>
      </section>
    </div>
  `
})
export class AppModalComponent {
  title = input.required<string>();
  eyebrow = input('');
  titleId = input('app-modal-title');
  closeLabel = input('Close modal');
  showActions = input(true);
  readonly dismiss = output<void>();

  protected close(): void {
    this.dismiss.emit();
  }
}
