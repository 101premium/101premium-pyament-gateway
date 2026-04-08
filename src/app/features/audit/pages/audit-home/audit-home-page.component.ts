import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  SummaryTableComponent,
  SummaryTableHeaders,
  SummaryTableRow
} from '../../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import { TablePaginationComponent } from '../../../../shared/components/table-pagination/table-pagination.component';
import { MerchantSearchService } from '../../../../shared/services/merchant-search.service';
import { AuditService } from '../../data/audit.service';

@Component({
  selector: 'app-audit-home-page',
  standalone: true,
  imports: [CommonModule, SummaryTableComponent, TablePaginationComponent],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-3">
      <div
        class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5"
      >
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">
            Audit
          </p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Activity log
          </h1>
        </div>
      </div>

      <section class="transactions-section mt-[0.15rem] grid gap-[0.65rem]">
        <app-summary-table
          [rows]="auditRows()"
          [headers]="tableHeaders"
          [isLoading]="isLoading()"
          [errorMessage]="errorMessage()"
          [loadingMessage]="'Loading audit logs...'"
          [emptyTitle]="'No audit records found'"
          [emptyHint]="'Try a different search or return later when more activity has been recorded.'"
          [detailedState]="true"
          [cardClass]="'payment-transactions-card'"
          [tableHeadClass]="'!text-[#4a5a73] !text-[0.72rem] !font-bold !tracking-[0.12em] bg-[rgba(248,250,253,0.95)]'"
          [skeletonRowCount]="8"
        >
          <app-table-pagination
            *ngIf="!isLoading() && !errorMessage() && totalItems() > 0"
            [ariaLabel]="'Audit pages'"
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
  `
})
export class AuditHomePageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly auditService = inject(AuditService);
  private readonly merchantSearch = inject(MerchantSearchService);
  protected readonly pageSize = 10;

  protected readonly auditRows = signal<SummaryTableRow[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly tableHeaders: SummaryTableHeaders = {
    primary: 'Activity',
    status: 'Type',
    amount: 'Actor',
    meta: 'Date'
  };

  constructor() {
    this.merchantSearch.debouncedQuery$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((searchParam) => this.loadAudit(searchParam, 0));
  }

  protected goToPreviousPage(): void {
    if (this.currentPage() <= 0 || this.isLoading()) {
      return;
    }
    this.loadAudit(this.merchantSearch.control.getRawValue(), this.currentPage() - 1);
  }

  protected goToNextPage(): void {
    const total = this.totalPages();
    if (this.isLoading() || total <= 0 || this.currentPage() + 1 >= total) {
      return;
    }
    this.loadAudit(this.merchantSearch.control.getRawValue(), this.currentPage() + 1);
  }

  protected goToPage(page: number): void {
    const total = this.totalPages();
    if (this.isLoading() || page < 0 || page >= total || page === this.currentPage()) {
      return;
    }
    this.loadAudit(this.merchantSearch.control.getRawValue(), page);
  }

  private loadAudit(searchParam: string, page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.auditService
      .getAuditLogs({
        searchParam,
        page,
        size: this.pageSize
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.auditRows.set(result.items);
          this.currentPage.set(result.currentPage);
          this.totalPages.set(result.totalPages);
          this.totalItems.set(result.totalItems);
        },
        error: (error: unknown) => {
          this.auditRows.set([]);
          this.currentPage.set(0);
          this.totalPages.set(0);
          this.totalItems.set(0);
          this.errorMessage.set(this.resolveErrorMessage(error));
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }

      if (error.status === 401) {
        return 'Audit session expired. Please sign in again.';
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to load audit logs right now.';
  }
}
