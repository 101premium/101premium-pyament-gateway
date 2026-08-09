import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  SummaryTableComponent,
  SummaryTableHeaders,
  SummaryTableRow
} from '../../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import { TablePaginationComponent } from '../../../../shared/components/table-pagination/table-pagination.component';
import { PageFooterComponent } from '../../../../shared/components/page-footer/page-footer.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { SettlementService } from '../../data/settlement.service';

@Component({
  selector: 'app-settlement-home-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SummaryTableComponent, TablePaginationComponent, PageFooterComponent],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-3">
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5">
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Settlement</p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Settlements
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <a
            *ngIf="canUploadSettlements"
            routerLink="/settlement/upload"
            class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#175cd3] bg-white px-4 py-2 text-sm font-semibold text-[#175cd3] shadow-sm transition hover:bg-[#f4f7fc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 21V9" />
              <path d="m7 14 5-5 5 5" />
              <path d="M5 3h14" />
            </svg>
            Upload
          </a>
          <button
            *ngIf="canDownloadSettlements"
            type="button"
            class="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#175cd3] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#144fb5] disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="isDownloading()"
            (click)="downloadSettlements()"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            {{ isDownloading() ? 'Downloading...' : 'Download' }}
          </button>
          <a
            *ngIf="canViewSettlementDetails"
            routerLink="/settlement/details"
            class="rounded-full border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)]"
          >
            View details
          </a>
        </div>
      </div>

      <section
        class="flex flex-wrap items-end gap-3 rounded-[1rem] border border-[rgba(138,158,191,0.16)] bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(48,72,112,0.05)]"
      >
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

        <label class="grid min-w-[12rem] flex-1 gap-1.5 text-sm font-semibold text-[#44546f]">
          Start date
          <input
            type="text"
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.22)] bg-white px-3 text-sm font-medium text-[#24324d] outline-0 transition focus:border-[#4b55e7]"
            placeholder="2026-08-09"
            [formControl]="startDateControl"
            [max]="endDateControl.value || today"
            (focus)="$any($event.target).type = 'date'"
            (blur)="restoreDatePlaceholder($event)"
          />
        </label>

        <label class="grid min-w-[12rem] flex-1 gap-1.5 text-sm font-semibold text-[#44546f]">
          End date
          <input
            type="text"
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.22)] bg-white px-3 text-sm font-medium text-[#24324d] outline-0 transition focus:border-[#4b55e7]"
            placeholder="2026-08-09"
            [formControl]="endDateControl"
            [min]="startDateControl.value"
            [max]="today"
            (focus)="$any($event.target).type = 'date'"
            (blur)="restoreDatePlaceholder($event)"
          />
        </label>

        <div class="flex gap-2">
          <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#16a34a] bg-[#16a34a] px-4 text-sm font-bold text-white transition hover:bg-[#15803d] disabled:opacity-60"
            [disabled]="isLoading()"
            (click)="applyFilters()"
          >
            Apply
          </button>
          <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[rgba(138,158,191,0.24)] bg-white px-4 text-sm font-bold text-[#52627c] transition hover:bg-[#f5f7fb] disabled:opacity-60"
            [disabled]="isLoading()"
            (click)="clearFilters()"
          >
            Clear
          </button>
        </div>
      </section>

      <section class="transactions-section mt-[0.15rem] grid gap-[0.65rem]">
        <app-summary-table
          [rows]="settlements()"
          [headers]="tableHeaders"
          [isLoading]="isLoading()"
          [errorMessage]="errorMessage()"
          [loadingMessage]="'Loading settlements...'"
          [emptyTitle]="'No settlements found'"
          [emptyHint]="'Settlement summaries will appear here once card transactions are settled.'"
          [detailedState]="true"
          [cardClass]="'payment-transactions-card'"
          [tableHeadClass]="'!text-[#4a5a73] !text-[0.72rem] !font-bold !tracking-[0.12em] bg-[rgba(248,250,253,0.95)]'"
        >
          <app-table-pagination
            *ngIf="!isLoading() && !errorMessage() && totalItems() > 0"
            [ariaLabel]="'Settlement pages'"
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
export class SettlementHomePageComponent {
  private readonly settlementService = inject(SettlementService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly pageSize = 10;
  protected readonly today = formatLocalIsoDate(new Date());
  protected readonly canUploadSettlements = this.resolveCanUploadSettlements();
  protected readonly canDownloadSettlements = this.hasAnyAuthority([
    'ROLE_SETTLEMENT',
    'ROLE_ADMIN',
    'ROLE_COMPLIANCE',
    'ROLE_MERCHANT_ADMIN'
  ]);
  protected readonly canViewSettlementDetails = this.hasAnyAuthority([
    'ROLE_SETTLEMENT',
    'ROLE_ADMIN',
    'ROLE_COMPLIANCE',
    'ROLE_MERCHANT_ADMIN'
  ]);
  protected readonly merchantIdControl = new FormControl('', { nonNullable: true });
  protected readonly startDateControl = new FormControl('', { nonNullable: true });
  protected readonly endDateControl = new FormControl('', { nonNullable: true });

  protected readonly settlements = signal<SummaryTableRow[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly isDownloading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly tableHeaders: SummaryTableHeaders = {
    primary: 'Transaction Date',
    status: 'Count',
    amount: 'Amount',
    transactionType: 'Fee',
    meta: 'Settlement'
  };

  constructor() {
    this.loadSettlements(0);
  }

  protected goToPreviousPage(): void {
    if (this.currentPage() <= 0 || this.isLoading()) return;
    this.loadSettlements(this.currentPage() - 1, this.merchantIdControl.getRawValue());
  }

  protected goToNextPage(): void {
    if (this.isLoading() || this.currentPage() + 1 >= this.totalPages()) return;
    this.loadSettlements(this.currentPage() + 1, this.merchantIdControl.getRawValue());
  }

  protected goToPage(page: number): void {
    if (this.isLoading() || page < 0 || page >= this.totalPages() || page === this.currentPage()) return;
    this.loadSettlements(page, this.merchantIdControl.getRawValue());
  }

  protected applyFilters(): void {
    if (!this.hasValidDateRange()) return;
    this.loadSettlements(0, this.merchantIdControl.getRawValue());
  }

  protected clearFilters(): void {
    this.merchantIdControl.setValue('');
    this.startDateControl.setValue('');
    this.endDateControl.setValue('');
    this.loadSettlements(0);
  }

  protected restoreDatePlaceholder(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) input.type = 'text';
  }

  protected downloadSettlements(): void {
    if (!this.canDownloadSettlements || this.isDownloading() || !isPlatformBrowser(this.platformId) || !this.hasValidDateRange()) return;

    this.isDownloading.set(true);
    this.settlementService
      .downloadSettlements({
        merchantId: this.merchantIdControl.getRawValue(),
        startDate: this.startDateControl.getRawValue(),
        endDate: this.endDateControl.getRawValue()
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
          this.toastService.show('Settlements downloaded.', 'success');
        },
        error: (error: unknown) => this.toastService.show(this.resolveDownloadErrorMessage(error))
      });
  }


  private loadSettlements(page: number, merchantId = ''): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.settlementService
      .getSettlements({ merchantId, page, size: this.pageSize })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.settlements.set(
            this.canViewSettlementDetails
              ? result.items
              : result.items.map((item) => ({ ...item, route: undefined, queryParams: undefined }))
          );
          this.currentPage.set(result.currentPage);
          this.totalPages.set(result.totalPages);
          this.totalItems.set(result.totalItems);
        },
        error: (error: unknown) => {
          this.settlements.set([]);
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
      if (error.status === 401) return 'Settlement session expired. Please sign in again.';
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return 'Unable to load settlements right now.';
  }

  private hasValidDateRange(): boolean {
    if (this.startDateControl.value && this.endDateControl.value && this.startDateControl.value > this.endDateControl.value) {
      this.toastService.show('Start date must be on or before end date.');
      return false;
    }
    return true;
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
    return filename || `settlements-${this.today}.xlsx`;
  }

  private resolveDownloadErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) return error.error.description;
      if (error.status === 401) return 'Settlement session expired. Please sign in again.';
      if (error.status === 404) return 'No settlements are available to download.';
    }
    return 'Unable to download settlements right now.';
  }

  private resolveCanUploadSettlements(): boolean {
    return this.hasAnyAuthority(['ROLE_SETTLEMENT', 'ROLE_ADMIN', 'ROLE_COMPLIANCE']);
  }

  private hasAnyAuthority(requiredAuthorities: string[]): boolean {
    const session = this.authService.getSession();
    const authorities = [session?.role, ...(session?.permissions ?? [])]
      .map((value) => value?.trim().toUpperCase().replace(/[\s-]+/g, '_'));
    return authorities.some((authority) => requiredAuthorities.includes(authority ?? ''));
  }
}

function formatLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
