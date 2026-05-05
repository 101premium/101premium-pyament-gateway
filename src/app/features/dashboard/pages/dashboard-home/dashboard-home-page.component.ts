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
import { DashboardStatsData } from '../../data/dashboard.models';

@Component({
  selector: 'app-dashboard-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, StableCoinWalletModalComponent, SummaryTableComponent],
  template: `
    <main class="dashboard-main merchant-main">
        <section class="merchant-stats">
          @if (statsLoading()) {
            <article class="merchant-stat-card" *ngFor="let _ of [1,2,3,4]">
              <p class="stat-label skeleton-text"></p>
              <strong class="skeleton-text"></strong>
            </article>
          } @else {
            <article class="merchant-stat-card" *ngFor="let stat of stats()">
              <p class="stat-label">{{ stat.label }}</p>
              <strong>{{ stat.value }}</strong>
              <span>{{ stat.note }}</span>
            </article>
          }
        </section>

        <section class="merchant-content">
          <div class="merchant-primary">
            <article class="merchant-panel chart-panel">
              <div class="panel-heading">
                <div>
                  <h3>Transaction Volume</h3>
                  <p>Nov 1 — Nov 14, 2023</p>
                </div>

                <div class="switch-pill" aria-label="Transaction range">
                  <button type="button">Weekly</button>
                  <button type="button" class="active">Monthly</button>
                </div>
              </div>

              <div class="chart-bars" aria-hidden="true">
                <span
                  *ngFor="let bar of chartBars; let i = index"
                  [style.height.%]="bar"
                  [class.active]="i === activeBarIndex"
                ></span>
              </div>
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
            [emptyTitle]="'No payment transactions found.'"
          />
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
  protected readonly tableHeaders: SummaryTableHeaders = {
    primary: 'Customer',
    status: 'Status',
    amount: 'Amount',
    meta: 'Date'
  };

  protected readonly chartBars = [36, 52, 42, 64, 56, 78, 88, 69, 61, 74, 64, 83, 56, 47];
  protected readonly activeBarIndex = 11;

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

  private mapStatsToCards(data: DashboardStatsData): { label: string; value: string; note: string }[] {
    return [
      { label: 'Total Transactions', value: String(data.totalCount), note: `Volume: ${data.totalTransaction}` },
      { label: 'Successful', value: String(data.successfulCount), note: `Volume: ${data.successfulTransaction}` },
      { label: 'Pending', value: String(data.pendingCount), note: `Volume: ${data.pendingTransaction}` },
      { label: 'Failed', value: String(data.failedCount), note: `Volume: ${data.failedTransaction}` }
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
      .getTransactions({
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
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }

      if (error.status === 401) {
        return 'Payment session expired. Please sign in again.';
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to load payment transactions right now.';
  }
}
