import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import {
  SummaryTableComponent,
  SummaryTableHeaders
} from '../../../../shared/components/payment-transactions-table/payment-transactions-table.component';
import { StableCoinWalletModalComponent } from '../../../../shared/components/stable-coin-wallet-modal/stable-coin-wallet-modal.component';
import { MerchantSearchService } from '../../../../shared/services/merchant-search.service';
import { PaymentTransaction } from '../../../payment/data/payments.models';
import { PaymentsService } from '../../../payment/data/payments.service';
import { DashboardService } from '../../data/dashboard.service';
import { DashboardChartBar, DashboardStatsData } from '../../data/dashboard.models';
import { PageFooterComponent } from '../../../../shared/components/page-footer/page-footer.component';
import { formatAmountNoCurrency, formatCount } from '../../../../shared/utils/format.utils';

@Component({
  selector: 'app-dashboard-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StableCoinWalletModalComponent, SummaryTableComponent, PageFooterComponent],
  template: `
    <main class="dashboard-main merchant-main">
        <section class="merchant-stats">
          @if (statsLoading()) {
            <article class="merchant-stat-card" *ngFor="let _ of [1,2,3,4]">
              <div class="skeleton-line skeleton-line--label"></div>
              <div class="skeleton-line skeleton-line--value"></div>
              <div class="skeleton-line skeleton-line--note"></div>
            </article>
          } @else {
            <article class="merchant-stat-card" *ngFor="let stat of stats()">
              <p class="stat-label">{{ stat.label }}</p>
              <strong>{{ stat.value }}</strong>
              <span>{{ stat.note }}</span>
            </article>
          }
        </section>

        <section class="merchant-stats-group grid gap-2.5">
          <div class="flex items-center justify-between">
            <h3 class="m-0 text-sm font-bold uppercase tracking-wider text-[#5f6d85]">Card Transactions</h3>
            <a routerLink="/payment/card-transactions" class="text-xs font-semibold text-[var(--primary)] no-underline hover:underline">View Card Transactions →</a>
          </div>
          <section class="merchant-stats">
            @if (cardStatsLoading()) {
              <article class="merchant-stat-card" *ngFor="let _ of [1,2,3,4]">
                <div class="skeleton-line skeleton-line--label"></div>
                <div class="skeleton-line skeleton-line--value"></div>
                <div class="skeleton-line skeleton-line--note"></div>
              </article>
            } @else {
              <article class="merchant-stat-card" *ngFor="let stat of cardStats()">
                <p class="stat-label">{{ stat.label }}</p>
                <strong>{{ stat.value }}</strong>
                <span>{{ stat.note }}</span>
              </article>
            }
          </section>
        </section>

        <section class="merchant-content">
          <div class="merchant-primary">
            <article class="merchant-panel chart-panel">
              <div class="panel-heading">
                <div>
                  <h3>Transaction Volume</h3>
                  <p>{{ graphDateRange() }}</p>
                </div>

                <div class="chart-controls">
                  <div class="switch-pill" aria-label="Transaction range">
                    <button type="button" class="active">Monthly</button>
                  </div>

                  <label class="chart-type-select" aria-label="Transaction type">
                    <select
                      [value]="selectedGraphTransactionType()"
                      (change)="changeGraphTransactionType($event)"
                    >
                      <option value="card">Card</option>
                      <option value="crypto">Stable Coin</option>
                    </select>
                  </label>
                </div>
              </div>

              @if (graphLoading()) {
                <div class="chart-bars chart-bars--loading" aria-hidden="true">
                  <span *ngFor="let _ of [1,2,3,4,5,6]" style="height: 40%"></span>
                </div>
              } @else if (chartBars().length) {
                <div class="chart-bars" aria-hidden="true">
                  <span
                    *ngFor="let bar of chartBars()"
                    [style.height.%]="bar.height"
                    [class.active]="bar.monthKey === currentMonthKey"
                    [title]="bar.label + ': ' + bar.amount"
                  ></span>
                </div>
                <div class="chart-labels">
                  <span *ngFor="let bar of chartBars()" [class.active]="bar.monthKey === currentMonthKey">
                    {{ bar.label }}
                  </span>
                </div>
              } @else {
                <p class="chart-empty">No graph data available.</p>
              }
            </article>
          </div>

          <aside class="merchant-secondary">
            <section class="quick-actions">
              <h3>Quick Actions</h3>

              @for (action of quickActions; track action.title) {
                @if (action.kind === 'wallet') {
                  <a
                    class="action-card cursor-pointer"
                    href="#"
                    (click)="$event.preventDefault(); openWalletModal()"
                  >
                    <div class="action-icon" [class]="action.iconClass">{{ action.icon }}</div>
                    <div class="action-copy">
                      <strong>{{ action.title }}</strong>
                      <span>{{ action.description }}</span>
                    </div>
                    <span class="action-arrow" aria-hidden="true">›</span>
                  </a>
                } @else {
                  <a class="action-card" [routerLink]="action.route">
                    <div class="action-icon" [class]="action.iconClass">{{ action.icon }}</div>
                    <div class="action-copy">
                      <strong>{{ action.title }}</strong>
                      <span>{{ action.description }}</span>
                    </div>
                    <span class="action-arrow" aria-hidden="true">›</span>
                  </a>
                }
              }
            </section>
          </aside>
        </section>

        <section class="transactions-section">
          <div class="section-header">
            <h3>Payment Transactions</h3>
            <a routerLink="/payment">View all →</a>
          </div>

          <app-summary-table
            [rows]="transactions()"
            [headers]="tableHeaders"
            [isLoading]="isLoading()"
            [errorMessage]="errorMessage()"
            [loadingMessage]="'Loading payment transactions...'"
            [emptyTitle]="'No transactions found'"
            [emptyHint]="'Refine your search or return later when new transactions have been processed.'"
            [detailedState]="true"
          />
        </section>

        <app-page-footer />
    </main>

    <app-stable-coin-wallet-modal
      *ngIf="walletModalOpen()"
      (dismiss)="closeWalletModal()"
      (generated)="handleWalletGenerated()"
    />
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class DashboardHomePageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly paymentsService = inject(PaymentsService);
  private readonly dashboardService = inject(DashboardService);
  private readonly merchantSearch = inject(MerchantSearchService);
  protected readonly pageSize = 10;

  protected readonly transactions = signal<PaymentTransaction[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly walletModalOpen = signal(false);
  protected readonly statsLoading = signal(false);
  protected readonly stats = signal<{ label: string; value: string; note: string }[]>([]);
  protected readonly cardStatsLoading = signal(false);
  protected readonly cardStats = signal<{ label: string; value: string; note: string }[]>([]);

  protected readonly tableHeaders: SummaryTableHeaders = {
    primary: 'Customer',
    status: 'Status',
    amount: 'Amount',
    meta: 'Date'
  };

  protected readonly chartBars = signal<DashboardChartBar[]>([]);
  protected readonly graphLoading = signal(false);
  protected readonly graphDateRange = signal('');
  protected readonly selectedGraphTransactionType = signal<'card' | 'crypto'>('card');
  protected readonly currentMonthKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  protected readonly quickActions = [
    {
      title: 'Create stable coin wallet',
      description: 'Generate wallet for stable coin payments',
      icon: '⊞',
      iconClass: 'invoice',
      kind: 'wallet'
    },
    {
      title: 'New Payment Link',
      description: 'Shareable link for quick checkout',
      icon: '⌁',
      iconClass: 'payment-link',
      route: '/payment-link'
    }
  ];

  constructor() {
    this.merchantSearch.debouncedQuery$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((searchParam) => this.loadTransactions(searchParam, 0));

    this.loadDashboardStats();
    this.loadCardStats();
    this.loadGraph();
  }

  private loadGraph(): void {
    this.graphLoading.set(true);

    this.dashboardService
      .getGraph(this.selectedGraphTransactionType())
      .pipe(finalize(() => this.graphLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (bars) => {
          this.chartBars.set(bars);
          if (bars.length) {
            this.graphDateRange.set(`${bars[0].label} — ${bars[bars.length - 1].label}`);
          }
        },
        error: () => this.chartBars.set([])
      });
  }

  protected changeGraphTransactionType(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedGraphTransactionType.set(value === 'crypto' ? 'crypto' : 'card');
    this.loadGraph();
  }

  private loadDashboardStats(): void {
    this.statsLoading.set(true);

    this.dashboardService
      .getStats()
      .pipe(
        finalize(() => this.statsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => this.stats.set(this.mapStatsToCards(data)),
        error: () => this.stats.set([])
      });
  }

  private loadCardStats(): void {
    this.cardStatsLoading.set(true);

    this.dashboardService
      .getStats('card')
      .pipe(
        finalize(() => this.cardStatsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => this.cardStats.set(this.mapCardStatsToCards(data)),
        error: () => this.cardStats.set([])
      });
  }

  private mapStatsToCards(data: DashboardStatsData): { label: string; value: string; note: string }[] {
    return [
      { label: 'Total Transactions', value: formatCount(data.totalCount), note: `Volume: ${formatAmountNoCurrency(data.totalTransaction)}` },
      { label: 'Successful', value: formatCount(data.successfulCount), note: `Volume: ${formatAmountNoCurrency(data.successfulTransaction)}` },
      { label: 'Pending', value: formatCount(data.pendingCount), note: `Volume: ${formatAmountNoCurrency(data.pendingTransaction)}` },
      { label: 'Failed', value: formatCount(data.failedCount), note: `Volume: ${formatAmountNoCurrency(data.failedTransaction)}` }
    ];
  }

  private mapCardStatsToCards(data: DashboardStatsData): { label: string; value: string; note: string }[] {
    return [
      { label: 'Total Card Transactions', value: formatCount(data.totalCount), note: `Volume: ${formatAmountNoCurrency(data.totalTransaction)}` },
      { label: 'Successful Card', value: formatCount(data.successfulCount), note: `Volume: ${formatAmountNoCurrency(data.successfulTransaction)}` },
      { label: 'Pending Card', value: formatCount(data.pendingCount), note: `Volume: ${formatAmountNoCurrency(data.pendingTransaction)}` },
      { label: 'Failed Card', value: formatCount(data.failedCount), note: `Volume: ${formatAmountNoCurrency(data.failedTransaction)}` }
    ];
  }

  protected openWalletModal(): void {
    this.walletModalOpen.set(true);
  }

  protected closeWalletModal(): void {
    this.walletModalOpen.set(false);
  }

  protected handleWalletGenerated(): void {
    this.loadTransactions(this.merchantSearch.control.getRawValue(), 0);
  }

  private loadTransactions(searchParam: string, page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.paymentsService
      .getCardTransactions({
        searchParam,
        page,
        size: this.pageSize
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (result) => {
          this.transactions.set(result.items);
        },
        error: (error: unknown) => {
          this.transactions.set([]);
          this.errorMessage.set(this.resolveErrorMessage(error));
        }
      });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) return '';
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to load payment transactions right now.';
  }
}
