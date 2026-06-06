import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  SummaryTableComponent,
  SummaryTableHeaders,
  SummaryTableRow
} from '../../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import { TablePaginationComponent } from '../../../../shared/components/table-pagination/table-pagination.component';
import { PageFooterComponent } from '../../../../shared/components/page-footer/page-footer.component';
import { SettlementService } from '../../data/settlement.service';

@Component({
  selector: 'app-settlement-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    SummaryTableComponent,
    TablePaginationComponent,
    PageFooterComponent
  ],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-3">
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5">
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Settlement</p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Settlement details
          </h1>
        </div>

        <a
          routerLink="/settlement"
          class="rounded-full border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)]"
        >
          Back to settlements
        </a>
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

        <label class="grid min-w-[14rem] flex-1 gap-1.5 text-sm font-semibold text-[#44546f]">
          Transaction Date
          <input
            type="date"
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.22)] bg-white px-3 text-sm font-medium text-[#24324d] outline-0 transition placeholder:text-[#9aa6bf] focus:border-[#4b55e7]"
            [formControl]="tranDateControl"
            (keydown.enter)="applyFilters()"
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
          [rows]="details()"
          [headers]="tableHeaders"
          [isLoading]="isLoading()"
          [errorMessage]="errorMessage()"
          [loadingMessage]="'Loading settlement details...'"
          [emptyTitle]="'No settlement details found'"
          [emptyHint]="'Try another merchant ID or transaction date.'"
          [detailedState]="true"
          [cardClass]="'payment-transactions-card'"
          [tableHeadClass]="'!text-[#4a5a73] !text-[0.72rem] !font-bold !tracking-[0.12em] bg-[rgba(248,250,253,0.95)]'"
        >
          <app-table-pagination
            *ngIf="!isLoading() && !errorMessage() && totalItems() > 0"
            [ariaLabel]="'Settlement detail pages'"
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
export class SettlementDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly settlementService = inject(SettlementService);
  protected readonly pageSize = 10;
  protected readonly merchantIdControl = new FormControl('', { nonNullable: true });
  protected readonly tranDateControl = new FormControl('', { nonNullable: true });

  protected readonly details = signal<SummaryTableRow[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly tableHeaders: SummaryTableHeaders = {
    primary: 'Customer',
    status: 'Status',
    amount: 'Amount',
    transactionType: 'Card Type',
    detail: 'Settlement Status',
    meta: 'Date'
  };

  constructor() {
    const merchantId = this.route.snapshot.queryParamMap.get('merchantId') ?? '';
    const tranDate = this.route.snapshot.queryParamMap.get('tranDate') ?? '';
    this.merchantIdControl.setValue(merchantId);
    this.tranDateControl.setValue(tranDate);
    this.loadDetails(0, merchantId, tranDate);
  }

  protected goToPreviousPage(): void {
    if (this.currentPage() <= 0 || this.isLoading()) return;
    this.loadDetails(this.currentPage() - 1, this.merchantIdControl.getRawValue(), this.tranDateControl.getRawValue());
  }

  protected goToNextPage(): void {
    if (this.isLoading() || this.currentPage() + 1 >= this.totalPages()) return;
    this.loadDetails(this.currentPage() + 1, this.merchantIdControl.getRawValue(), this.tranDateControl.getRawValue());
  }

  protected goToPage(page: number): void {
    if (this.isLoading() || page < 0 || page >= this.totalPages() || page === this.currentPage()) return;
    this.loadDetails(page, this.merchantIdControl.getRawValue(), this.tranDateControl.getRawValue());
  }

  protected applyFilters(): void {
    this.loadDetails(0, this.merchantIdControl.getRawValue(), this.tranDateControl.getRawValue());
  }

  protected clearFilters(): void {
    this.merchantIdControl.setValue('');
    this.tranDateControl.setValue('');
    this.loadDetails(0);
  }

  private loadDetails(page: number, merchantId = '', tranDate = ''): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.settlementService
      .getSettlementDetails({ merchantId, tranDate, page, size: this.pageSize })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.details.set(result.items);
          this.currentPage.set(result.currentPage);
          this.totalPages.set(result.totalPages);
          this.totalItems.set(result.totalItems);
        },
        error: (error: unknown) => {
          this.details.set([]);
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
      if (error.status === 401) return 'Settlement detail session expired. Please sign in again.';
    }
    if (error instanceof Error && error.message.trim()) return error.message;
    return 'Unable to load settlement details right now.';
  }
}
