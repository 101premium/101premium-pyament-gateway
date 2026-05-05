import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { distinctUntilChanged, finalize } from 'rxjs';
import {
  SummaryTableComponent,
  SummaryTableHeaders
} from '../../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import { AppModalComponent } from '../../../../shared/components/app-modal/app-modal.component';
import { TablePaginationComponent } from '../../../../shared/components/table-pagination/table-pagination.component';
import { MerchantSearchService } from '../../../../shared/services/merchant-search.service';
import { PaymentAsset, PaymentAssetNetwork, PaymentTransaction } from '../../data/payments.models';
import { PaymentsService } from '../../data/payments.service';

@Component({
  selector: 'app-payment-home-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppModalComponent,
    SummaryTableComponent,
    TablePaginationComponent
  ],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-3">
        <div
          class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5"
        >
          <div>
            <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">
              {{ isPayoutPage ? 'Payout' : 'Transactions' }}
            </p>
            <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
              {{ isPayoutPage ? 'Payout transactions' : 'Transactions' }}
            </h1>
          </div>

          <button
            *ngIf="isPayoutPage"
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#16803c] bg-[#1c7f3d] px-4 text-sm font-bold text-white transition hover:bg-[#146b33]"
            (click)="initiatePayout()"
          >
            Initiate Payout
          </button>
        </div>

        <div
          *ngIf="payoutSuccess()"
          class="rounded-2xl border border-[#d9f0dd] bg-[#edf9ef] px-4 py-3 text-sm font-medium text-[#1c7f3d]"
        >
          {{ payoutSuccess() }}
        </div>

        <section class="transactions-section mt-[0.15rem] grid gap-[0.65rem]">
          <app-summary-table
            [rows]="transactions()"
            [headers]="tableHeaders"
            [isLoading]="isLoading()"
            [errorMessage]="errorMessage()"
            [loadingMessage]="'Loading transactions...'"
            [emptyTitle]="'No transactions found'"
            [emptyHint]="'Refine your search or return later when new transactions have been processed.'"
            [detailedState]="true"
            [cardClass]="'payment-transactions-card'"
            [tableHeadClass]="'!text-[#4a5a73] !text-[0.72rem] !font-bold !tracking-[0.12em] bg-[rgba(248,250,253,0.95)]'"
          >
            <app-table-pagination
              *ngIf="!isLoading() && !errorMessage() && totalItems() > 0"
              [ariaLabel]="'Transaction pages'"
              [currentPage]="currentPage()"
              [totalPages]="totalPages()"
              [totalItems]="totalItems()"
              [pageSize]="pageSize"
              [disabled]="isLoading()"
              (previous)="goToPreviousPage()"
              (next)="goToNextPage()"
              (pageSelect)="goToPage($event)"
            />
          </app-summary-table>
        </section>

        <footer class="merchant-footer">
          <span>© 2023 PayStream Technologies. All rights reserved.</span>
          <div>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">API Docs</a>
          </div>
        </footer>
    </main>

    <app-modal
      *ngIf="payoutModalOpen()"
      [title]="'Initiate Payout'"
      [eyebrow]="'Payout'"
      [titleId]="'initiate-payout-title'"
      (dismiss)="closePayoutModal()"
    >
      <form id="payout-form" class="grid gap-4 md:grid-cols-2" [formGroup]="payoutForm" (ngSubmit)="submitPayout()">
        <label class="grid gap-1.5">
          <span class="text-sm font-semibold text-[#42526b]">Amount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-3 text-sm text-[#24324d] outline-none"
            formControlName="amount"
            placeholder="0.00"
          />
        </label>

        <label class="grid gap-1.5">
          <span class="text-sm font-semibold text-[#42526b]">Coin</span>
          <select
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-3 text-sm text-[#24324d] outline-none"
            formControlName="coin"
          >
            <option value="">{{ assetLoading() ? 'Loading coins...' : 'Select coin' }}</option>
            @for (asset of coinOptions(); track asset.coin) {
              <option [value]="asset.coin">{{ asset.name }} ({{ asset.coin }})</option>
            }
          </select>
          <span *ngIf="assetError()" class="text-xs font-medium text-[#b42318]">{{ assetError() }}</span>
        </label>

        <label class="grid gap-1.5">
          <span class="text-sm font-semibold text-[#42526b]">Network</span>
          <select
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-3 text-sm text-[#24324d] outline-none"
            formControlName="network"
          >
            <option value="">{{ networkLoading() ? 'Loading networks...' : 'Select network' }}</option>
            @for (network of networkOptions(); track network.network) {
              <option [value]="network.network">{{ network.network }}</option>
            }
          </select>
          <span *ngIf="networkError()" class="text-xs font-medium text-[#b42318]">{{ networkError() }}</span>
        </label>

        <label class="grid gap-1.5">
          <span class="text-sm font-semibold text-[#42526b]">Wallet Address</span>
          <input
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-3 text-sm text-[#24324d] outline-none"
            formControlName="walletAddress"
            placeholder="Wallet address"
          />
        </label>

        <label class="grid gap-1.5 md:col-span-2">
          <span class="text-sm font-semibold text-[#42526b]">Description</span>
          <textarea
            rows="3"
            class="rounded-xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-3 py-3 text-sm text-[#24324d] outline-none"
            formControlName="description"
            placeholder="Payout description"
          ></textarea>
        </label>

        <div
          *ngIf="payoutForm.invalid && payoutForm.touched"
          class="rounded-xl border border-[#ffd4d0] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#b42318] md:col-span-2"
        >
          Complete the payout fields before continuing.
        </div>

        <div
          *ngIf="payoutError()"
          class="rounded-xl border border-[#ffd4d0] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#b42318] md:col-span-2"
        >
          {{ payoutError() }}
        </div>
      </form>

      <ng-container modal-actions>
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[rgba(138,158,191,0.24)] bg-white px-4 text-sm font-bold text-[#52627c] transition hover:bg-[#f5f7fb]"
          [disabled]="payoutSubmitting()"
          (click)="closePayoutModal()"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="payout-form"
          class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#16803c] bg-[#1c7f3d] px-4 text-sm font-bold text-white transition hover:bg-[#146b33] disabled:cursor-not-allowed disabled:opacity-65"
          [disabled]="payoutSubmitting()"
        >
          {{ payoutSubmitting() ? 'Submitting...' : 'Continue' }}
        </button>
      </ng-container>
    </app-modal>
  `
})
export class PaymentHomePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly paymentsService = inject(PaymentsService);
  private readonly merchantSearch = inject(MerchantSearchService);
  private readonly router = inject(Router);
  protected readonly pageSize = 10;
  protected readonly isPayoutPage = this.router.url.startsWith('/payout');
  protected readonly payoutForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    coin: ['', Validators.required],
    network: ['', Validators.required],
    description: ['', Validators.required],
    walletAddress: ['', Validators.required]
  });

  protected readonly transactions = signal<PaymentTransaction[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly payoutModalOpen = signal(false);
  protected readonly coinOptions = signal<PaymentAsset[]>([]);
  protected readonly assetLoading = signal(false);
  protected readonly assetError = signal('');
  protected readonly networkOptions = signal<PaymentAssetNetwork[]>([]);
  protected readonly networkLoading = signal(false);
  protected readonly networkError = signal('');
  protected readonly payoutSubmitting = signal(false);
  protected readonly payoutError = signal('');
  protected readonly payoutSuccess = signal('');
  protected readonly tableHeaders: SummaryTableHeaders = {
    primary: 'Customer',
    status: 'Status',
    amount: 'Amount',
    meta: 'Date'
  };

  constructor() {
    this.merchantSearch.debouncedQuery$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((searchParam) => this.loadTransactions(searchParam, 0));

    if (this.isPayoutPage) {
      this.loadPaymentAssets();
    }

    this.payoutForm.controls.coin.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((coin) => {
        this.payoutForm.controls.network.setValue('');
        this.networkOptions.set([]);
        this.networkError.set('');

        const selectedCoin = coin.trim();
        if (selectedCoin) {
          this.loadPaymentAssetNetworks(selectedCoin);
        }
      });
  }

  protected goToPreviousPage(): void {
    if (this.currentPage() <= 0 || this.isLoading()) {
      return;
    }
    this.loadTransactions(this.merchantSearch.control.getRawValue(), this.currentPage() - 1);
  }

  protected goToNextPage(): void {
    const total = this.totalPages();
    if (this.isLoading() || total <= 0 || this.currentPage() + 1 >= total) {
      return;
    }
    this.loadTransactions(this.merchantSearch.control.getRawValue(), this.currentPage() + 1);
  }

  protected goToPage(page: number): void {
    const total = this.totalPages();
    if (this.isLoading() || page < 0 || page >= total || page === this.currentPage()) {
      return;
    }
    this.loadTransactions(this.merchantSearch.control.getRawValue(), page);
  }

  protected initiatePayout(): void {
    if (!this.coinOptions().length && !this.assetLoading()) {
      this.loadPaymentAssets();
    }
    this.payoutError.set('');
    this.payoutSuccess.set('');
    this.payoutForm.markAsPristine();
    this.payoutForm.markAsUntouched();
    this.payoutModalOpen.set(true);
  }

  protected closePayoutModal(): void {
    this.payoutModalOpen.set(false);
  }

  protected submitPayout(): void {
    if (this.payoutSubmitting()) {
      return;
    }

    if (this.payoutForm.invalid) {
      this.payoutForm.markAllAsTouched();
      return;
    }

    const payload = {
      reference: createUuid(),
      ...this.payoutForm.getRawValue()
    };

    this.payoutSubmitting.set(true);
    this.payoutError.set('');
    this.payoutSuccess.set('');

    this.paymentsService
      .initiateWalletPayout(payload)
      .pipe(finalize(() => this.payoutSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.payoutSuccess.set(response.description?.trim() || 'Payout initiated successfully.');
          this.closePayoutModal();
          this.loadTransactions(this.merchantSearch.control.getRawValue(), this.currentPage());
        },
        error: (error: unknown) => {
          this.payoutError.set(this.resolvePayoutErrorMessage(error));
        }
      });
  }

  private loadTransactions(searchParam: string, page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.paymentsService
      .getTransactions({
        searchParam,
        page,
        size: this.pageSize
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.transactions.set(result.items);
          this.currentPage.set(result.currentPage);
          this.totalPages.set(result.totalPages);
          this.totalItems.set(result.totalItems);
        },
        error: (error: unknown) => {
          this.transactions.set([]);
          this.currentPage.set(0);
          this.totalPages.set(0);
          this.totalItems.set(0);
          this.errorMessage.set(this.resolveErrorMessage(error));
        }
      });
  }

  private loadPaymentAssets(): void {
    this.assetLoading.set(true);
    this.assetError.set('');

    this.paymentsService
      .getPaymentAssets()
      .pipe(finalize(() => this.assetLoading.set(false)))
      .subscribe({
        next: (assets) => {
          this.coinOptions.set(assets.filter((asset) => asset.coin?.trim()));
          if (!assets.length) {
            this.assetError.set('No coins available.');
          }
        },
        error: (error: unknown) => {
          this.coinOptions.set([]);
          this.assetError.set(this.resolveAssetErrorMessage(error));
        }
      });
  }

  private loadPaymentAssetNetworks(coin: string): void {
    this.networkLoading.set(true);
    this.networkError.set('');

    this.paymentsService
      .getPaymentAssetNetworks(coin)
      .pipe(finalize(() => this.networkLoading.set(false)))
      .subscribe({
        next: (networks) => {
          this.networkOptions.set(networks.filter((network) => network.network?.trim()));
          if (!networks.length) {
            this.networkError.set('No networks available for this coin.');
          }
        },
        error: (error: unknown) => {
          this.networkOptions.set([]);
          this.networkError.set(this.resolveNetworkErrorMessage(error));
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }

      if (error.status === 401) {
        return 'Transaction session expired. Please sign in again.';
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to load transactions right now.';
  }

  private resolveAssetErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }

      if (error.status === 401) {
        return 'Asset session expired. Please sign in again.';
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to load coins right now.';
  }

  private resolveNetworkErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }

      if (error.status === 401) {
        return 'Network session expired. Please sign in again.';
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to load networks right now.';
  }

  private resolvePayoutErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }

      if (error.status === 401) {
        return 'Payout session expired. Please sign in again.';
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to initiate payout right now.';
  }
}

function createUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
