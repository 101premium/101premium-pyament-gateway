import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
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
import {
  formatDisplayDate,
  formatMoney,
  initialsFromName,
  statusClassForLabel,
  titleCase
} from '../../../../shared/utils/format.utils';
import { normalizeApiPageIndex } from '../../../../shared/utils/pagination.utils';
import { PaymentLinkRecord } from '../../data/payment-link.models';
import { PaymentLinkService } from '../../data/payment-link.service';

@Component({
  selector: 'app-payment-link-home-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SummaryTableComponent, TablePaginationComponent, PageFooterComponent],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-3">
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5">
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Payment Link</p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Payment links
          </h1>
        </div>
        <a
          routerLink="/payment-links/new"
          class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#16a34a] bg-[#16a34a] px-4 text-sm font-bold !text-white transition hover:bg-[#15803d]"
        >
          New payment link
        </a>
      </div>

      <section
        class="flex flex-wrap items-end gap-3 rounded-[1rem] border border-[rgba(138,158,191,0.16)] bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(48,72,112,0.05)]"
      >
        <label class="grid min-w-[14rem] flex-1 gap-1.5 text-sm font-semibold text-[#44546f]">
          Search
          <input
            type="search"
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.22)] bg-white px-3 text-sm font-medium text-[#24324d] outline-0 transition placeholder:text-[#9aa6bf] focus:border-[#4b55e7]"
            placeholder="Reference, name or email"
            [formControl]="searchControl"
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
            [max]="endDateControl.value"
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
          [rows]="links()"
          [headers]="tableHeaders"
          [isLoading]="isLoading()"
          [errorMessage]="errorMessage()"
          [loadingMessage]="'Loading payment links...'"
          [emptyTitle]="'No payment links found'"
          [emptyHint]="'Payment links you create will appear here.'"
          [detailedState]="true"
          [cardClass]="'payment-transactions-card'"
          [tableHeadClass]="'!text-[#4a5a73] !text-[0.72rem] !font-bold !tracking-[0.12em] bg-[rgba(248,250,253,0.95)]'"
        >
          <app-table-pagination
            *ngIf="!isLoading() && !errorMessage() && totalItems() > 0"
            [ariaLabel]="'Payment link pages'"
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            [totalItems]="totalItems()"
            [pageSize]="pageSize"
            [disabled]="isLoading()"
            (previous)="goToPage(currentPage() - 1)"
            (next)="goToPage(currentPage() + 1)"
            (pageSelect)="goToPage($event)"
          />
        </app-summary-table>
      </section>

      <app-page-footer />
    </main>
  `
})
export class PaymentLinkHomePageComponent {
  private readonly paymentLinkService = inject(PaymentLinkService);

  protected readonly pageSize = 10;
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly startDateControl = new FormControl('', { nonNullable: true });
  protected readonly endDateControl = new FormControl('', { nonNullable: true });

  protected readonly links = signal<SummaryTableRow[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly tableHeaders: SummaryTableHeaders = {
    primary: 'Customer',
    status: 'Status',
    amount: 'Amount',
    meta: 'Created'
  };

  constructor() {
    this.loadLinks(0);
  }

  protected applyFilters(): void {
    this.loadLinks(0);
  }

  protected clearFilters(): void {
    this.searchControl.setValue('');
    this.startDateControl.setValue('');
    this.endDateControl.setValue('');
    this.loadLinks(0);
  }

  protected goToPage(page: number): void {
    if (this.isLoading() || page < 0 || page >= this.totalPages() || page === this.currentPage()) return;
    this.loadLinks(page);
  }

  protected restoreDatePlaceholder(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) input.type = 'text';
  }

  private loadLinks(page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.paymentLinkService
      .getPaymentLinks({
        page,
        size: this.pageSize,
        searchParam: this.searchControl.getRawValue(),
        startDate: this.startDateControl.getRawValue(),
        endDate: this.endDateControl.getRawValue()
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const pageData = res.data;
          this.links.set((pageData?.data ?? []).map(toRow));
          this.currentPage.set(normalizeApiPageIndex(pageData?.currentPage));
          this.totalPages.set(pageData?.totalPages ?? 0);
          this.totalItems.set(pageData?.totalItems ?? 0);
        },
        error: (error: unknown) => {
          this.links.set([]);
          this.currentPage.set(0);
          this.totalPages.set(0);
          this.totalItems.set(0);
          this.errorMessage.set(resolveErrorMessage(error));
        }
      });
  }
}

/** The list item shape is undocumented; read the likely fields defensively. */
function toRow(record: PaymentLinkRecord): SummaryTableRow {
  const text = (key: string): string => {
    const value = record[key];
    return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  };
  const name = [text('firstName'), text('lastName')].filter(Boolean).join(' ') || text('reference') || 'Payment link';
  const status = text('status') || 'Pending';
  const createdAt = text('createdAt') || text('createdDate') || text('date');

  const reference = text('reference');

  return {
    route: reference ? `/payment-link/${encodeURIComponent(reference)}` : undefined,
    initials: initialsFromName(name),
    name,
    email: text('email') || text('reference'),
    status: titleCase(status),
    statusClass: statusClassForLabel(status),
    amount: text('amount') ? formatMoney(text('amount'), text('currency') || 'USD') : '-',
    date: createdAt ? formatDisplayDate(createdAt) : '-'
  };
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error?.description === 'string' && error.error.description.trim()) return error.error.description;
    if (error.status === 401) return 'Session expired. Please sign in again.';
  }
  return 'Unable to load payment links right now.';
}
