import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AppModeService } from '../../../../core/services/app-mode.service';
import { PageFooterComponent } from '../../../../shared/components/page-footer/page-footer.component';
import { formatMoney } from '../../../../shared/utils/format.utils';
import { PaymentLinkDetails } from '../../data/payment-link.models';
import { PaymentLinkService } from '../../data/payment-link.service';

/** Response keys that should not be shown to the user (lower-case). */
const HIDDEN_FIELDS = new Set(['env', 'apikey', 'checkouturl']);

interface DetailField {
  label: string;
  value: string;
}

interface DetailSection {
  title: string;
  fields: DetailField[];
}

const SECTIONS: { title: string; keys: string[] }[] = [
  { title: 'Customer', keys: ['firstName', 'lastName', 'email', 'phoneNumber'] },
  { title: 'Location', keys: ['address', 'city', 'countryCode'] },
  { title: 'Payment', keys: ['reference', 'amount', 'currency', 'status', 'redirectUrl'] },
  { title: 'Merchant', keys: ['merchantName', 'merchantId', 'uniqueId'] }
];

@Component({
  selector: 'app-payment-link-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageFooterComponent],
  template: `
    <main class="dashboard-main merchant-main grid gap-5">
      <section class="grid gap-2 border-b border-[rgba(138,158,191,0.16)] pb-3">
        <a routerLink="/payment-link" class="text-sm font-semibold text-[#16a34a] hover:underline">&larr; Payment links</a>
        <p class="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Payment link</p>
        <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.9rem)] font-bold leading-tight tracking-[-0.025em] text-[#2a3340]">
          {{ reference }}
        </h1>
      </section>

      <section *ngIf="isLoading()" class="merchant-panel rounded-[1.8rem] text-sm text-[#61708a]">Loading payment link...</section>
      <section
        *ngIf="errorMessage()"
        class="rounded-2xl border border-[#ffd4d0] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#b42318]"
      >
        {{ errorMessage() }}
      </section>

      <ng-container *ngIf="!isLoading() && !errorMessage()">
        <section class="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <article class="merchant-panel grid content-center gap-2 rounded-[1.8rem]">
            <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">Amount</p>
            <p class="m-0 text-4xl font-bold tracking-[-0.03em] text-[#2a3340]">{{ amountText() }}</p>
            <p class="m-0 text-sm text-[#607089]">
              {{ customerName() }}<ng-container *ngIf="email()"> &middot; {{ email() }}</ng-container>
            </p>
            <span
              class="mt-1 w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]"
              [ngClass]="appMode.isLive ? 'bg-[#edf9ef] text-[#1c7f3d]' : 'bg-[#fff6e5] text-[#a15c07]'"
            >
              {{ appMode.isLive ? 'Live' : 'Test' }}
            </span>
          </article>

          <article class="grid content-center gap-3 rounded-[1.8rem] bg-[#0f172a] p-6 text-white">
            <p class="m-0 text-xs uppercase tracking-[0.18em] text-white/60">Share this link</p>
            <p class="m-0 break-all rounded-xl bg-white/10 px-4 py-3 text-sm leading-6">{{ checkoutUrl() }}</p>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="primary-btn" (click)="copyLink()">{{ copied() ? 'Copied!' : 'Copy link' }}</button>
              <a
                [href]="checkoutUrl()"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-h-11 items-center justify-center rounded-full border border-white/30 px-5 text-sm font-semibold !text-white transition hover:bg-white/10"
              >
                Open checkout
              </a>
            </div>
          </article>
        </section>

        <section class="grid gap-5 md:grid-cols-2">
          <article *ngFor="let section of sections()" class="merchant-panel grid content-start gap-4 rounded-[1.8rem]">
            <h2 class="m-0 text-base font-bold text-[#2f3743]">{{ section.title }}</h2>
            <dl class="m-0 grid gap-3">
              <div
                *ngFor="let field of section.fields"
                class="flex items-start justify-between gap-4 border-b border-[rgba(138,158,191,0.14)] pb-3 last:border-b-0 last:pb-0"
              >
                <dt class="shrink-0 text-sm text-[#607089]">{{ field.label }}</dt>
                <dd class="m-0 break-all text-right text-sm font-semibold text-[#2f3743]">{{ field.value }}</dd>
              </div>
            </dl>
          </article>
        </section>
      </ng-container>

      <app-page-footer />
    </main>
  `
})
export class PaymentLinkDetailPageComponent {
  private readonly paymentLinkService = inject(PaymentLinkService);
  protected readonly appMode = inject(AppModeService);

  protected readonly reference = inject(ActivatedRoute).snapshot.paramMap.get('reference') ?? '';
  protected readonly details = signal<PaymentLinkDetails>({});
  protected readonly checkoutUrl = signal('');
  protected readonly copied = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  protected readonly customerName = computed(
    () => [this.read('firstName'), this.read('lastName')].filter(Boolean).join(' ') || 'Customer'
  );
  protected readonly email = computed(() => this.read('email'));
  protected readonly amountText = computed(() => {
    const amount = this.read('amount');
    return amount ? formatMoney(amount, this.read('currency') || 'USD') : '-';
  });
  protected readonly sections = computed<DetailSection[]>(() => {
    const data = this.details();
    const used = new Set<string>();
    const sections: DetailSection[] = SECTIONS.map(({ title, keys }) => ({
      title,
      fields: keys.flatMap((key) => {
        used.add(key);
        const value = this.read(key);
        return value ? [{ label: toLabel(key), value }] : [];
      })
    }));

    const other = Object.keys(data)
      .filter((key) => !used.has(key) && !HIDDEN_FIELDS.has(key.toLowerCase()))
      .flatMap((key) => {
        const value = this.read(key);
        return value ? [{ label: toLabel(key), value }] : [];
      });
    if (other.length) sections.push({ title: 'Other', fields: other });

    return sections.filter((section) => section.fields.length);
  });

  constructor() {
    this.paymentLinkService
      .getPaymentLinkDetails({ reference: this.reference, env: String(this.appMode.mode()) })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const data = res.data ?? {};
          if (!Object.keys(data).length) {
            this.errorMessage.set('No payment link found.');
            return;
          }
          this.details.set(data);
          const apiUrl = typeof data['checkoutUrl'] === 'string' ? data['checkoutUrl'] : '';
          this.checkoutUrl.set(
            apiUrl ||
              `${environment.paymentLinkCheckoutBaseUrl}/${encodeURIComponent(this.reference)}/${this.appMode.mode()}`
          );
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

  protected copyLink(): void {
    navigator.clipboard?.writeText(this.checkoutUrl()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  private read(key: string): string {
    const value = this.details()[key];
    return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  }
}

function toLabel(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
