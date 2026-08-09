import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  SummaryTableComponent,
  SummaryTableHeaders
} from '../../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import { TablePaginationComponent } from '../../../../shared/components/table-pagination/table-pagination.component';
import { PageFooterComponent } from '../../../../shared/components/page-footer/page-footer.component';
import { MerchantSearchService } from '../../../../shared/services/merchant-search.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PaymentTransaction } from '../../data/payments.models';
import { PaymentsService } from '../../data/payments.service';

@Component({
  selector: 'app-card-transaction-page',
  standalone: true,
  imports: [
    CommonModule,
    SummaryTableComponent,
    TablePaginationComponent,
    PageFooterComponent
  ],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-3">
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5">
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Payments</p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Card transactions
          </h1>
        </div>
        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#175cd3] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#144fb5] disabled:cursor-not-allowed disabled:opacity-60"
          [disabled]="isDownloading()"
          (click)="downloadTransactions()"
        >
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          {{ isDownloading() ? 'Downloading...' : 'Download' }}
        </button>
      </div>

      <section class="flex flex-wrap items-end gap-3 rounded-xl border border-[#e4eaf2] bg-white p-4 shadow-sm">
        <label class="grid min-w-[14rem] flex-[2] gap-1.5 text-sm font-semibold text-[#344054]">
          Search
          <input
            type="search"
            class="min-h-10 rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm font-normal text-[#344054] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-2 focus:ring-[rgba(23,92,211,0.12)]"
            placeholder="Reference, customer, card..."
            [value]="filterSearch()"
            (input)="filterSearch.set($any($event.target).value)"
            (keyup.enter)="applyFilters()"
          />
        </label>
        <label *ngIf="isSuperAdmin" class="grid min-w-[14rem] flex-1 gap-1.5 text-sm font-semibold text-[#344054]">
          Merchant ID
          <input
            type="text"
            class="min-h-10 rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm font-normal text-[#344054] outline-none transition placeholder:text-[#98a2b3] focus:border-[#175cd3] focus:ring-2 focus:ring-[rgba(23,92,211,0.12)]"
            placeholder="Merchant ID"
            [value]="merchantId()"
            (input)="merchantId.set($any($event.target).value)"
            (keyup.enter)="applyFilters()"
          />
        </label>
        <label class="grid min-w-[12rem] flex-1 gap-1.5 text-sm font-semibold text-[#344054]">
          Start date
          <input
            type="date"
            class="min-h-10 rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm font-normal text-[#344054] outline-none transition focus:border-[#175cd3] focus:ring-2 focus:ring-[rgba(23,92,211,0.12)]"
            [value]="startDate()"
            [max]="endDate() || today"
            (change)="startDate.set($any($event.target).value)"
          />
        </label>
        <label class="grid min-w-[12rem] flex-1 gap-1.5 text-sm font-semibold text-[#344054]">
          End date
          <input
            type="date"
            class="min-h-10 rounded-lg border border-[#d0d5dd] bg-white px-3 text-sm font-normal text-[#344054] outline-none transition focus:border-[#175cd3] focus:ring-2 focus:ring-[rgba(23,92,211,0.12)]"
            [value]="endDate()"
            [min]="startDate()"
            [max]="today"
            (change)="endDate.set($any($event.target).value)"
          />
        </label>
        <button
          type="button"
          class="min-h-10 rounded-lg border border-[#175cd3] bg-white px-4 py-2 text-sm font-semibold text-[#175cd3] transition hover:bg-[#f4f7fc] disabled:cursor-not-allowed disabled:opacity-60"
          [disabled]="isLoading()"
          (click)="applyFilters()"
        >
          Apply filters
        </button>
        <button
          *ngIf="hasFilters()"
          type="button"
          class="min-h-10 px-2 py-2 text-sm font-semibold text-[#667085] transition hover:text-[#344054] disabled:cursor-not-allowed disabled:opacity-60"
          [disabled]="isLoading()"
          (click)="clearFilters()"
        >
          Clear
        </button>
      </section>

      <section class="transactions-section mt-[0.15rem] grid gap-[0.65rem]">
        <app-summary-table
          [rows]="transactions()"
          [headers]="tableHeaders"
          [isLoading]="isLoading()"
          [errorMessage]="errorMessage()"
          [loadingMessage]="'Loading card transactions...'"
          [emptyTitle]="'No card transactions found'"
          [emptyHint]="'Refine your search or return later when new card transactions have been processed.'"
          [detailedState]="true"
          [cardClass]="'payment-transactions-card card-transactions-card'"
          [tableHeadClass]="'!text-[#4a5a73] !text-[0.72rem] !font-bold !tracking-[0.12em] bg-[rgba(248,250,253,0.95)]'"
        >
          <app-table-pagination
            *ngIf="!isLoading() && !errorMessage() && totalItems() > 0"
            [ariaLabel]="'Card transaction pages'"
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
  `
})
export class CardTransactionPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly paymentsService = inject(PaymentsService);
  private readonly merchantSearch = inject(MerchantSearchService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly pageSize = 10;
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly isSuperAdmin = this.resolveIsSuperAdmin();

  protected readonly transactions = signal<PaymentTransaction[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly isDownloading = signal(false);
  protected readonly filterSearch = signal('');
  protected readonly merchantId = signal('');
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly errorMessage = signal('');
  protected readonly tableHeaders: SummaryTableHeaders = {
    primary: 'Customer',
    status: 'Status',
    amount: 'Amount',
    transactionType: 'Card Type',
    merchantId: 'Merchant ID',
    transactionId: 'Transaction ID',
    meta: 'Date'
  };

  constructor() {
    this.merchantSearch.debouncedQuery$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((searchParam) => {
        this.filterSearch.set(searchParam);
        this.loadTransactions(searchParam, 0);
      });
  }

  protected goToPreviousPage(): void {
    if (this.currentPage() <= 0 || this.isLoading()) return;
    this.loadTransactions(this.filterSearch(), this.currentPage() - 1);
  }

  protected goToNextPage(): void {
    if (this.isLoading() || this.currentPage() + 1 >= this.totalPages()) return;
    this.loadTransactions(this.filterSearch(), this.currentPage() + 1);
  }

  protected goToPage(page: number): void {
    if (this.isLoading() || page < 0 || page >= this.totalPages() || page === this.currentPage()) return;
    this.loadTransactions(this.filterSearch(), page);
  }

  protected applyFilters(): void {
    if (this.startDate() && this.endDate() && this.startDate() > this.endDate()) {
      this.toastService.show('Start date must be on or before end date.');
      return;
    }

    this.merchantSearch.control.setValue(this.filterSearch(), { emitEvent: false });
    this.loadTransactions(this.filterSearch(), 0);
  }

  protected clearFilters(): void {
    this.filterSearch.set('');
    this.merchantId.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.merchantSearch.control.setValue('', { emitEvent: false });
    this.loadTransactions('', 0);
  }

  protected hasFilters(): boolean {
    return !!(
      this.filterSearch().trim() ||
      (this.isSuperAdmin && this.merchantId().trim()) ||
      this.startDate() ||
      this.endDate()
    );
  }

  protected downloadTransactions(): void {
    if (this.isDownloading() || !isPlatformBrowser(this.platformId)) return;

    this.isDownloading.set(true);
    this.paymentsService
      .downloadCardTransactions({
        searchParam: this.filterSearch(),
        merchantId: this.isSuperAdmin ? this.merchantId() : undefined,
        startDate: this.startDate(),
        endDate: this.endDate()
      })
      .pipe(finalize(() => this.isDownloading.set(false)))
      .subscribe({
        next: (response) => {
          const fileUrl = this.safeDownloadUrl(response.data);
          if (!fileUrl) {
            this.toastService.show('The server did not return a valid download link.');
            return;
          }

          const link = document.createElement('a');
          link.href = fileUrl.href;
          link.download = this.downloadFilename(fileUrl);
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.click();
          this.toastService.show('Card transactions downloaded.', 'success');
        },
        error: (error: unknown) => this.toastService.show(this.resolveDownloadErrorMessage(error))
      });
  }

  private loadTransactions(searchParam: string, page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.paymentsService
      .getCardTransactions({
        searchParam,
        merchantId: this.isSuperAdmin ? this.merchantId() : undefined,
        startDate: this.startDate(),
        endDate: this.endDate(),
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

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) return error.error.description;
      if (error.status === 401) return 'Card transaction session expired. Please sign in again.';
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return 'Unable to load card transactions right now.';
  }

  private safeDownloadUrl(value: string | null | undefined): URL | null {
    try {
      const url = new URL(value ?? '');
      return ['http:', 'https:'].includes(url.protocol) ? url : null;
    } catch {
      return null;
    }
  }

  private downloadFilename(url: URL): string {
    const filename = decodeURIComponent(url.pathname.split('/').pop() ?? '').trim();
    return filename || `card-transactions-${new Date().toISOString().slice(0, 10)}.xlsx`;
  }

  private resolveDownloadErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return 'Card transaction session expired. Please sign in again.';
      if (error.status === 404) return 'No card transactions are available to download.';
    }
    return 'Unable to download card transactions right now.';
  }

  private resolveIsSuperAdmin(): boolean {
    const session = this.authService.getSession();
    const roleValues = [session?.role, session?.userCategory, ...(session?.permissions ?? [])]
      .map((value) => value?.trim().toUpperCase().replace(/[\s-]+/g, '_'));

    return roleValues.some((value) =>
      ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'SUPER_ADMIN', 'SUPERADMIN'].includes(value ?? '')
    );
  }
}
