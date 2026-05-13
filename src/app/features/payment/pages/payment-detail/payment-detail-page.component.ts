import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PaymentsService } from '../../data/payments.service';

@Component({
  selector: 'app-payment-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-4">
      <div class="flex items-center justify-between gap-4 border-b border-[rgba(138,158,191,0.16)] pb-2">
        <div class="grid gap-1">
          <p class="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Payments</p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Transaction details
          </h1>
        </div>
        <a routerLink="/payment" class="rounded-full border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)]">
          Back to payments
        </a>
      </div>

      <article *ngIf="isLoading()" class="merchant-panel rounded-[1.8rem] p-6">
        <p class="m-0 text-sm text-[#61708a]">Loading transaction details...</p>
      </article>

      <article *ngIf="!isLoading() && errorMessage()" class="merchant-panel rounded-[1.8rem] border border-[#ffd7d3] bg-[#fff6f5] p-6">
        <p class="m-0 text-sm font-medium text-[#b42318]">{{ errorMessage() }}</p>
      </article>

      <section *ngIf="!isLoading() && transaction()" class="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_340px]">
        <article class="merchant-panel rounded-[1.8rem] p-6">
          <div class="flex items-start justify-between gap-4 border-b border-[rgba(138,158,191,0.14)] pb-4">
            <div class="grid gap-2">
              <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#8fa0b8]">Reference</p>
              <strong class="text-xl text-[#2f3743]">{{ transaction()!.reference }}</strong>
              <span class="text-sm text-[#607089]">{{ transaction()!.message }}</span>
            </div>
            <span class="status-pill" [class]="transaction()!.statusClass">{{ transaction()!.status }}</span>
          </div>

          <dl class="mt-5 grid gap-0">
            <div class="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-4 border-t border-[rgba(138,158,191,0.14)] py-3 first:border-t-0 first:pt-0" *ngFor="let item of detailRows()">
              <dt class="text-xs font-bold uppercase tracking-[0.06em] text-[#7a8aa3]">{{ item.label }}</dt>
              <dd class="m-0 break-words text-sm text-[#2a3340]">{{ item.value }}</dd>
            </div>
          </dl>
        </article>

        <aside class="merchant-panel rounded-[1.8rem] p-6">
          <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">Summary</p>
          <div class="mt-4 grid gap-4 rounded-[1.4rem] bg-[#f8fbff] p-4">
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Customer</span>
              <strong class="mt-1 block text-base text-[#2f3743]">{{ transaction()!.customerName }}</strong>
              <span class="text-sm text-[#607089]">{{ transaction()!.email }}</span>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Amount</span>
              <strong class="mt-1 block text-base text-[#2f3743]">{{ transaction()!.amount }}</strong>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Created</span>
              <span class="mt-1 block text-sm text-[#607089]">{{ transaction()!.createdDate }}</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  `
})
export class PaymentDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentsService = inject(PaymentsService);

  protected readonly transaction = signal<ReturnType<PaymentsService['mapTransactionDetailForView']> | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  constructor() {
    const transactionId = this.route.snapshot.paramMap.get('transactionId') ?? '';

    this.paymentsService
      .getTransactionDetail(transactionId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (transaction) => this.transaction.set(transaction),
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.transaction.set(null);
        }
      });
  }

  protected detailRows(): { label: string; value: string }[] {
    const transaction = this.transaction();
    if (!transaction) {
      return [];
    }

    return [
      { label: 'Merchant', value: transaction.merchantName },
      { label: 'Merchant ID', value: transaction.merchantId },
      { label: 'Transaction ID', value: transaction.transactionId },
      { label: 'Payment Ref', value: transaction.paymentReference },
      { label: 'Country', value: transaction.countryCode },
      { label: 'Rail', value: transaction.rail },
      { label: 'Card PAN', value: transaction.cardPan },
      { label: 'Redirect URL', value: transaction.redirectUrl },
      { label: 'Checkout URL', value: transaction.checkoutUrl },
      { label: 'Crypto Mode', value: transaction.cryptoMode }
    ].filter(({ value }) => value && value !== 'Unavailable');
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
      if (error.status === 404) {
        return 'Transaction not found.';
      }
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return 'Unable to load this transaction right now.';
  }
}
