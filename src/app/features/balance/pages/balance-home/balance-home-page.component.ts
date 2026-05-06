import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { distinctUntilChanged, finalize } from 'rxjs';
import { AppModalComponent } from '../../../../shared/components/app-modal/app-modal.component';
import {
  SummaryTableComponent,
  SummaryTableHeaders
} from '../../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import { TablePaginationComponent } from '../../../../shared/components/table-pagination/table-pagination.component';
import { PaymentAsset, PaymentAssetNetwork, PaymentWallet } from '../../../payment/data/payments.models';
import { PaymentsService } from '../../../payment/data/payments.service';
import { BalanceRow } from '../../data/balance.models';
import { BalanceService } from '../../data/balance.service';
import { PageFooterComponent } from '../../../../shared/components/page-footer/page-footer.component';

@Component({
  selector: 'app-balance-home-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppModalComponent,
    SummaryTableComponent,
    TablePaginationComponent,
    PageFooterComponent
  ],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-3">
      <div
        class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5"
      >
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">
            Balance
          </p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Merchant balances
          </h1>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#2e39d3] bg-[#2e39d3] px-4 text-sm font-bold text-white transition hover:bg-[#2630b8]"
            (click)="openWalletModal()"
          >
            Generate stable coin wallet
          </button>
          <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[rgba(138,158,191,0.24)] bg-white px-4 text-sm font-bold text-[#52627c] transition hover:bg-[#f5f7fb]"
            [attr.aria-pressed]="showBalances()"
            (click)="toggleBalanceVisibility()"
          >
            {{ showBalances() ? 'Hide balance' : 'Show balance' }}
          </button>
        </div>
      </div>

      <section
        class="flex flex-wrap items-end gap-3 rounded-[1rem] border border-[rgba(138,158,191,0.16)] bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(48,72,112,0.05)]"
      >
        <label class="grid min-w-[14rem] flex-1 gap-1.5 text-sm font-semibold text-[#44546f]">
          Search Param
          <input
            type="search"
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.22)] bg-white px-3 text-sm font-medium text-[#24324d] outline-0 transition placeholder:text-[#9aa6bf] focus:border-[#4b55e7]"
            placeholder="Search param"
            [formControl]="searchParamControl"
            autocomplete="off"
            (keydown.enter)="applyFilters()"
          />
        </label>

        <label class="grid min-w-[14rem] flex-1 gap-1.5 text-sm font-semibold text-[#44546f]">
          Merchant ID
          <input
            type="search"
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.22)] bg-white px-3 text-sm font-medium text-[#24324d] outline-0 transition placeholder:text-[#9aa6bf] focus:border-[#4b55e7]"
            placeholder="Merchant ID"
            [formControl]="merchantIdControl"
            autocomplete="off"
            (keydown.enter)="applyFilters()"
          />
        </label>

        <div class="flex gap-2">
          <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#2e39d3] bg-[#2e39d3] px-4 text-sm font-bold text-white transition hover:bg-[#2630b8]"
            [disabled]="isLoading()"
            (click)="applyFilters()"
          >
            Apply
          </button>
          <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[rgba(138,158,191,0.24)] bg-white px-4 text-sm font-bold text-[#52627c] transition hover:bg-[#f5f7fb]"
            [disabled]="isLoading()"
            (click)="clearFilters()"
          >
            Clear
          </button>
        </div>
      </section>

      <section class="transactions-section mt-[0.15rem] grid gap-[0.65rem]">
        <app-summary-table
          [rows]="displayBalances()"
          [headers]="tableHeaders"
          [isLoading]="isLoading()"
          [errorMessage]="errorMessage()"
          [loadingMessage]="'Loading balances...'"
          [emptyTitle]="'No balances found'"
          [emptyHint]="'Balances will appear here once accounts have available funds.'"
          [detailedState]="true"
          [cardClass]="'payment-transactions-card'"
          [tableHeadClass]="'!text-[#4a5a73] !text-[0.72rem] !font-bold !tracking-[0.12em] bg-[rgba(248,250,253,0.95)]'"
        >
          <app-table-pagination
            *ngIf="!isLoading() && !errorMessage() && totalItems() > 0"
            [ariaLabel]="'Balance pages'"
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

      <app-page-footer />
    </main>

    <app-modal
      *ngIf="walletModalOpen()"
      [title]="'Generate stable coin wallet'"
      [eyebrow]="'Wallet'"
      [titleId]="'stable-coin-wallet-title'"
      (dismiss)="closeWalletModal()"
    >
      <form
        *ngIf="!walletResult()"
        id="wallet-form"
        class="grid gap-4 md:grid-cols-2"
        [formGroup]="walletForm"
        (ngSubmit)="submitWallet()"
      >
        <label class="grid gap-1.5 md:col-span-2">
          <span class="text-sm font-semibold text-[#42526b]">Customer Email</span>
          <input
            type="email"
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-3 text-sm text-[#24324d] outline-none"
            formControlName="customEmail"
            placeholder="customer@email.com"
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

        <div
          *ngIf="walletForm.invalid && walletForm.touched"
          class="rounded-xl border border-[#ffd4d0] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#b42318] md:col-span-2"
        >
          Complete the wallet fields before generating an address.
        </div>

        <div
          *ngIf="walletError()"
          class="rounded-xl border border-[#ffd4d0] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#b42318] md:col-span-2"
        >
          {{ walletError() }}
        </div>
      </form>

      <div *ngIf="walletResult()" class="grid gap-3 rounded-[1.2rem] bg-[#f8fbff] p-4 text-sm text-[#607089]">
        <div>
          <span class="block text-xs font-bold uppercase tracking-[0.14em] text-[#91a0bb]">Wallet Address</span>
          <strong class="mt-1 block break-all text-[#2f3743]">{{ walletResult()!.address }}</strong>
        </div>
        <div class="grid gap-2 md:grid-cols-2">
          <span>{{ walletResult()!.currency }} · {{ walletResult()!.network }}</span>
          <span>{{ walletResult()!.message }}</span>
        </div>
        <p class="m-0 text-xs font-medium text-[#b54708]">{{ walletResult()!.notice }}</p>
        <div class="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center rounded-xl border border-[rgba(138,158,191,0.24)] bg-white px-3 text-sm font-bold text-[#52627c] transition hover:bg-[#f5f7fb]"
            (click)="copyWalletAddress()"
          >
            Copy Address
          </button>
          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#2e39d3] bg-[#2e39d3] px-3 text-sm font-bold text-white transition hover:bg-[#2630b8]"
            (click)="copyWalletDetails()"
          >
            Copy All
          </button>
        </div>
        <p *ngIf="copyMessage()" class="m-0 text-xs font-bold text-[#1c7f3d]">{{ copyMessage() }}</p>
        <p *ngIf="copyError()" class="m-0 text-xs font-bold text-[#b42318]">{{ copyError() }}</p>
      </div>

      <ng-container modal-actions>
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[rgba(138,158,191,0.24)] bg-white px-4 text-sm font-bold text-[#52627c] transition hover:bg-[#f5f7fb]"
          [disabled]="walletSubmitting()"
          (click)="closeWalletModal()"
        >
          Close
        </button>
        <button
          *ngIf="!walletResult()"
          type="submit"
          form="wallet-form"
          class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#2e39d3] bg-[#2e39d3] px-4 text-sm font-bold text-white transition hover:bg-[#2630b8] disabled:cursor-not-allowed disabled:opacity-65"
          [disabled]="walletSubmitting()"
        >
          {{ walletSubmitting() ? 'Generating...' : 'Generate wallet' }}
        </button>
      </ng-container>
    </app-modal>
  `
})
export class BalanceHomePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly balanceService = inject(BalanceService);
  private readonly paymentsService = inject(PaymentsService);
  protected readonly pageSize = 10;
  protected readonly searchParamControl = new FormControl('', { nonNullable: true });
  protected readonly merchantIdControl = new FormControl('', { nonNullable: true });
  protected readonly walletForm = this.fb.nonNullable.group({
    customEmail: ['', [Validators.required, Validators.email]],
    coin: ['', Validators.required],
    network: ['', Validators.required]
  });

  protected readonly balances = signal<BalanceRow[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showBalances = signal(false);
  protected readonly walletModalOpen = signal(false);
  protected readonly walletSubmitting = signal(false);
  protected readonly walletError = signal('');
  protected readonly walletResult = signal<PaymentWallet | null>(null);
  protected readonly copyMessage = signal('');
  protected readonly copyError = signal('');
  protected readonly coinOptions = signal<PaymentAsset[]>([]);
  protected readonly assetLoading = signal(false);
  protected readonly assetError = signal('');
  protected readonly networkOptions = signal<PaymentAssetNetwork[]>([]);
  protected readonly networkLoading = signal(false);
  protected readonly networkError = signal('');
  protected readonly displayBalances = computed(() => {
    if (this.showBalances()) {
      return this.balances();
    }

    return this.balances().map((row) => ({
      ...row,
      amountText: '******'
    }));
  });
  protected readonly tableHeaders: SummaryTableHeaders = {
    primary: 'Asset',
    status: 'Status',
    amount: 'Balance',
    meta: 'Created'
  };

  constructor() {
    this.loadBalances(0);

    this.walletForm.controls.coin.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((coin) => {
        this.walletForm.controls.network.setValue('');
        this.networkOptions.set([]);
        this.networkError.set('');

        const selectedCoin = coin.trim();
        if (selectedCoin) {
          this.loadPaymentAssetNetworks(selectedCoin);
        }
      });
  }

  protected applyFilters(): void {
    if (this.isLoading()) {
      return;
    }
    this.loadBalances(0);
  }

  protected clearFilters(): void {
    if (this.isLoading()) {
      return;
    }
    this.searchParamControl.setValue('');
    this.merchantIdControl.setValue('');
    this.loadBalances(0);
  }

  protected toggleBalanceVisibility(): void {
    this.showBalances.update((visible) => !visible);
  }

  protected openWalletModal(): void {
    if (!this.coinOptions().length && !this.assetLoading()) {
      this.loadPaymentAssets();
    }
    this.walletError.set('');
    this.walletResult.set(null);
    this.copyMessage.set('');
    this.copyError.set('');
    this.walletForm.markAsPristine();
    this.walletForm.markAsUntouched();
    this.walletModalOpen.set(true);
  }

  protected closeWalletModal(): void {
    if (this.walletSubmitting()) {
      return;
    }
    this.walletModalOpen.set(false);
  }

  protected goToPreviousPage(): void {
    if (this.currentPage() <= 0 || this.isLoading()) {
      return;
    }
    this.loadBalances(this.currentPage() - 1);
  }

  protected goToNextPage(): void {
    const total = this.totalPages();
    if (this.isLoading() || total <= 0 || this.currentPage() + 1 >= total) {
      return;
    }
    this.loadBalances(this.currentPage() + 1);
  }

  protected goToPage(page: number): void {
    const total = this.totalPages();
    if (this.isLoading() || page < 0 || page >= total || page === this.currentPage()) {
      return;
    }
    this.loadBalances(page);
  }

  private loadBalances(page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.balanceService
      .getBalances({
        searchParam: this.searchParamControl.getRawValue(),
        merchantId: this.merchantIdControl.getRawValue(),
        page,
        size: this.pageSize
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.balances.set(result.items);
          this.currentPage.set(result.currentPage);
          this.totalPages.set(result.totalPages);
          this.totalItems.set(result.totalItems);
        },
        error: (error: unknown) => {
          this.balances.set([]);
          this.currentPage.set(0);
          this.totalPages.set(0);
          this.totalItems.set(0);
          this.errorMessage.set(this.resolveErrorMessage(error));
        }
      });
  }

  protected submitWallet(): void {
    if (this.walletSubmitting()) {
      return;
    }

    if (this.walletForm.invalid) {
      this.walletForm.markAllAsTouched();
      return;
    }

    this.walletSubmitting.set(true);
    this.walletError.set('');
    this.walletResult.set(null);
    this.copyMessage.set('');
    this.copyError.set('');

    this.paymentsService
      .createPaymentWallet({
        ref: createUuid(),
        ...this.walletForm.getRawValue()
      })
      .pipe(finalize(() => this.walletSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.walletResult.set(response.data ?? null);
          this.loadBalances(this.currentPage());
        },
        error: (error: unknown) => {
          this.walletError.set(this.resolveWalletErrorMessage(error));
        }
      });
  }

  protected copyWalletAddress(): void {
    const address = this.walletResult()?.address;
    if (!address) {
      return;
    }
    void this.copyToClipboard(address, 'Wallet address copied.');
  }

  protected copyWalletDetails(): void {
    const wallet = this.walletResult();
    if (!wallet) {
      return;
    }

    const details = [
      `Wallet Address: ${wallet.address}`,
      `Currency: ${wallet.currency}`,
      `Network: ${wallet.network}`,
      `Expiry: ${wallet.message}`,
      `Warning: ${wallet.notice}`
    ].join('\n');

    void this.copyToClipboard(details, 'Wallet details copied.');
  }

  private async copyToClipboard(value: string, successMessage: string): Promise<void> {
    this.copyMessage.set('');
    this.copyError.set('');

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard is not available in this browser.');
      }

      await navigator.clipboard.writeText(value);
      this.copyMessage.set(successMessage);
    } catch (error) {
      this.copyError.set(error instanceof Error ? error.message : 'Unable to copy right now.');
    }
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
        return 'Balance session expired. Please sign in again.';
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to load balances right now.';
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

  private resolveWalletErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
      if (error.status === 401) {
        return 'Wallet session expired. Please sign in again.';
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to generate wallet right now.';
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
