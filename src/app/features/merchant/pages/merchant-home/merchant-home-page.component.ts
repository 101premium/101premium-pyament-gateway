import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  SummaryTableComponent,
  SummaryTableHeaders,
  SummaryTableRow
} from '../../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import { TablePaginationComponent } from '../../../../shared/components/table-pagination/table-pagination.component';
import { MerchantSearchService } from '../../../../shared/services/merchant-search.service';
import { MerchantStatData } from '../../data/merchant.models';
import { MerchantService } from '../../data/merchant.service';

@Component({
  selector: 'app-merchant-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SummaryTableComponent, TablePaginationComponent],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-3">
      <div
        class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5"
      >
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">
            Merchants
          </p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Business directory
          </h1>
        </div>
        <a routerLink="/merchants/new" class="primary-btn min-w-[180px]">
          Add merchant
        </a>
      </div>

      <p
        *ngIf="statsError()"
        class="m-0 rounded-[10px] border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[0.82rem] text-[#b91c1c]"
      >
        {{ statsError() }}
      </p>

      <section *ngIf="statsLoading()" class="merchant-stats" aria-busy="true">
        <article
          class="merchant-stat-card"
          *ngFor="let _ of statSkeletonSlots"
          data-stat-tone="muted"
        >
          <p class="stat-label text-[#9aa6bd]">Overview</p>
          <strong class="text-[#cbd5e1]">—</strong>
          <span class="text-transparent select-none">.</span>
        </article>
      </section>

      <section *ngIf="!statsLoading() && statCards().length > 0" class="merchant-stats">
        <article
          class="merchant-stat-card"
          *ngFor="let stat of statCards()"
          [attr.data-stat-tone]="stat.tone"
        >
          <p class="stat-label">{{ stat.label }}</p>
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.note }}</span>
        </article>
      </section>

      <section class="transactions-section mt-[0.15rem] grid gap-[0.65rem]">
        <app-summary-table
          [rows]="tableRows()"
          [headers]="tableHeaders"
          [isLoading]="isLoading()"
          [errorMessage]="errorMessage()"
          [loadingMessage]="'Loading merchants...'"
          [emptyTitle]="'No merchants on this page.'"
          [emptyHint]="'Try another page or check back later.'"
          [detailedState]="true"
          [cardClass]="'payment-transactions-card'"
          [tableHeadClass]="'!text-[#4a5a73] !text-[0.72rem] !font-bold !tracking-[0.12em] bg-[rgba(248,250,253,0.95)]'"
        >
          <app-table-pagination
            *ngIf="!isLoading() && !errorMessage() && totalItems() > 0"
            [ariaLabel]="'Merchant pages'"
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
        </div>
      </footer>
    </main>
  `
})
export class MerchantHomePageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly merchantService = inject(MerchantService);
  private readonly merchantSearch = inject(MerchantSearchService);

  protected readonly pageSize = 10;
  protected readonly tableHeaders: SummaryTableHeaders = {
    primary: 'Business',
    status: 'Account status',
    amount: 'CAC / TIN',
    meta: 'Created'
  };

  protected readonly tableRows = signal<SummaryTableRow[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly merchantStats = signal<MerchantStatData | null>(null);
  protected readonly statsLoading = signal(true);
  protected readonly statsError = signal('');
  protected readonly statSkeletonSlots = [0, 1, 2, 3, 4, 5, 6];

  protected readonly statCards = computed(() => {
    const s = this.merchantStats();
    if (!s) {
      return [];
    }
    return [
      { label: 'Total merchants', value: s.totalMerchant, note: 'All registrations', tone: 'neutral' as const },
      { label: 'Active', value: s.activeMerchant, note: 'Currently active', tone: 'positive' as const },
      { label: 'Inactive', value: s.inactiveMerchant, note: 'Inactive accounts', tone: 'muted' as const },
      { label: 'Deactivated', value: s.deactivatedMerchant, note: 'Deactivated', tone: 'warning' as const },
      { label: 'Approved', value: s.approved, note: 'Approved applications', tone: 'approved' as const },
      { label: 'Pending approval', value: s.pendingApproval, note: 'Awaiting review', tone: 'pending' as const },
      { label: 'Rejected', value: s.rejectedApproval, note: 'Rejected applications', tone: 'negative' as const }
    ];
  });

  constructor() {
    this.merchantService
      .getMerchantStat()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.statsLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          this.merchantStats.set(data);
          this.statsError.set('');
        },
        error: (error: unknown) => {
          this.merchantStats.set(null);
          this.statsError.set(this.resolveErrorMessage(error, 'Unable to load merchant overview.'));
        }
      });

    this.merchantSearch.debouncedQuery$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadMerchants(0);
    });
  }

  protected goToPreviousPage(): void {
    if (this.currentPage() <= 0 || this.isLoading()) {
      return;
    }
    this.loadMerchants(this.currentPage() - 1);
  }

  protected goToNextPage(): void {
    const total = this.totalPages();
    if (this.isLoading() || total <= 0 || this.currentPage() + 1 >= total) {
      return;
    }
    this.loadMerchants(this.currentPage() + 1);
  }

  protected goToPage(page: number): void {
    const total = this.totalPages();
    if (this.isLoading() || page < 0 || page >= total || page === this.currentPage()) {
      return;
    }
    this.loadMerchants(page);
  }

  private loadMerchants(page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.merchantService
      .getMerchants({ page, size: this.pageSize })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.tableRows.set(result.items);
          this.currentPage.set(result.currentPage);
          this.totalPages.set(result.totalPages);
          this.totalItems.set(result.totalItems);
        },
        error: (error: unknown) => {
          this.tableRows.set([]);
          this.currentPage.set(0);
          this.totalPages.set(0);
          this.totalItems.set(0);
          this.errorMessage.set(this.resolveErrorMessage(error));
        }
      });
  }

  private resolveErrorMessage(error: unknown, fallback = 'Unable to load merchants right now.'): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
      if (error.status === 401) {
        return 'Session expired. Please sign in again.';
      }
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return fallback;
  }
}
