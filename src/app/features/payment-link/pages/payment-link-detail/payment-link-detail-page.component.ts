import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AppModeService } from '../../../../core/services/app-mode.service';
import { PageFooterComponent } from '../../../../shared/components/page-footer/page-footer.component';
import { PaymentLinkService } from '../../data/payment-link.service';

/** Response keys that should not be shown to the user (lower-case). */
const HIDDEN_FIELDS = new Set(['env', 'apikey']);

interface DetailField {
  label: string;
  value: string;
  isLink: boolean;
}

@Component({
  selector: 'app-payment-link-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageFooterComponent],
  template: `
    <main class="dashboard-main merchant-main grid gap-5">
      <section class="grid gap-2 border-b border-[rgba(138,158,191,0.16)] pb-3">
        <a routerLink="/payment-link" class="text-sm font-semibold text-[#16a34a]">&larr; Payment links</a>
        <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.9rem)] font-bold leading-tight tracking-[-0.025em] text-[#2a3340]">
          {{ reference }}
        </h1>
      </section>

      <section class="merchant-panel rounded-[1.8rem]">
        <p *ngIf="isLoading()" class="m-0 text-sm text-[#61708a]">Loading payment link...</p>
        <p *ngIf="errorMessage()" class="m-0 rounded-2xl border border-[#ffd4d0] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#b42318]">
          {{ errorMessage() }}
        </p>
        <dl *ngIf="!isLoading() && !errorMessage()" class="m-0 grid gap-x-8 gap-y-4 md:grid-cols-2">
          <div *ngFor="let field of fields()" class="grid gap-1 border-b border-[rgba(138,158,191,0.14)] pb-3">
            <dt class="text-xs font-semibold uppercase tracking-[0.12em] text-[#8fa0b8]">{{ field.label }}</dt>
            <dd class="m-0 break-all text-sm font-semibold text-[#2f3743]">
              <a *ngIf="field.isLink; else plain" [href]="field.value" target="_blank" rel="noopener noreferrer" class="text-[#16a34a] hover:underline">{{ field.value }}</a>
              <ng-template #plain>{{ field.value }}</ng-template>
            </dd>
          </div>
        </dl>
      </section>

      <app-page-footer />
    </main>
  `
})
export class PaymentLinkDetailPageComponent {
  private readonly paymentLinkService = inject(PaymentLinkService);
  private readonly appMode = inject(AppModeService);

  protected readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  protected readonly fields = signal<DetailField[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  constructor() {
    this.paymentLinkService
      .getPaymentLinkDetails({ reference: this.reference, env: String(this.appMode.mode()) })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const fields = Object.entries(res.data ?? {})
            .filter(([key, value]) => !HIDDEN_FIELDS.has(key.toLowerCase()) && value !== null && value !== undefined && typeof value !== 'object')
            .map(([key, value]) => ({
              label: key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' '),
              value: String(value),
              isLink: /^https?:\/\//.test(String(value))
            }));
          this.fields.set(fields);
          if (!fields.length) this.errorMessage.set('No payment link found.');
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            error instanceof HttpErrorResponse && typeof error.error?.description === 'string' && error.error.description.trim()
              ? error.error.description
              : 'Unable to load this payment link right now.'
          );
        }
      });
  }
}
