import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { TablePaginationComponent } from '../../../../shared/components/table-pagination/table-pagination.component';
import { WalletTransaction } from '../../data/wallet.models';
import { WalletService } from '../../data/wallet.service';

@Component({
  selector: 'app-wallet-home-page',
  standalone: true,
  imports: [CommonModule, TablePaginationComponent],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-3">
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5">
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Wallet</p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Wallet Transactions
          </h1>
        </div>
      </div>

      <section class="transactions-section mt-[0.15rem] grid gap-[0.65rem]">
        <article class="merchant-panel payment-transactions-card rounded-[1.8rem] overflow-hidden">

          <article *ngIf="isLoading()" class="p-6">
            <p class="m-0 text-sm text-[#61708a]">Loading wallet transactions...</p>
          </article>

          <article *ngIf="!isLoading() && errorMessage()" class="border border-[#ffd7d3] bg-[#fff6f5] p-6">
            <p class="m-0 text-sm font-medium text-[#b42318]">{{ errorMessage() }}</p>
          </article>

          <ng-container *ngIf="!isLoading() && !errorMessage()">
            <div *ngIf="transactions().length === 0" class="p-8 text-center">
              <p class="m-0 text-sm text-[#61708a]">No wallet transactions found.</p>
            </div>

            <table *ngIf="transactions().length > 0" class="w-full border-collapse text-sm">
              <thead>
                <tr class="bg-[rgba(248,250,253,0.95)]">
                  <th class="px-5 py-3.5 text-left text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#4a5a73]">Address</th>
                  <th class="px-5 py-3.5 text-left text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#4a5a73]">Merchant</th>
                  <th class="px-5 py-3.5 text-left text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#4a5a73]">Mode</th>
                  <th class="px-5 py-3.5 text-left text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#4a5a73]">Amount</th>
                  <th class="px-5 py-3.5 text-left text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#4a5a73]">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let tx of transactions()"
                  class="border-t border-[rgba(138,158,191,0.12)] transition-colors hover:bg-[#f8fbff]"
                >
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-3">
                      <div class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eef0ff] text-[0.7rem] font-bold text-[#2e39d3]">
                        {{ tx.initials }}
                      </div>
                      <span class="max-w-[200px] truncate font-medium text-[#2a3340]" [title]="tx.address">
                        {{ tx.address }}
                      </span>
                    </div>
                  </td>
                  <td class="px-5 py-4 text-[#607089]">{{ tx.merchantName }}</td>
                  <td class="px-5 py-4">
                    <span class="status-pill" [class]="tx.cryptoModeClass">{{ tx.cryptoMode }}</span>
                  </td>
                  <td class="px-5 py-4 font-semibold text-[#2a3340]">{{ tx.amount }}</td>
                  <td class="px-5 py-4 text-[#607089]">{{ tx.date }}</td>
                </tr>
              </tbody>
            </table>

            <app-table-pagination
              *ngIf="transactions().length > 0"
              [ariaLabel]="'Wallet transaction pages'"
              [currentPage]="currentPage()"
              [totalPages]="totalPages()"
              [totalItems]="totalItems()"
              [pageSize]="pageSize"
              [disabled]="isLoading()"
              (previous)="goToPreviousPage()"
              (next)="goToNextPage()"
              (pageSelect)="goToPage($event)"
            />
          </ng-container>
        </article>
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
export class WalletHomePageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly walletService = inject(WalletService);
  protected readonly pageSize = 10;

  protected readonly transactions = signal<WalletTransaction[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  constructor() {
    this.loadTransactions(0);
  }

  protected goToPreviousPage(): void {
    if (this.currentPage() <= 0 || this.isLoading()) return;
    this.loadTransactions(this.currentPage() - 1);
  }

  protected goToNextPage(): void {
    if (this.isLoading() || this.currentPage() + 1 >= this.totalPages()) return;
    this.loadTransactions(this.currentPage() + 1);
  }

  protected goToPage(page: number): void {
    if (this.isLoading() || page < 0 || page >= this.totalPages() || page === this.currentPage()) return;
    this.loadTransactions(page);
  }

  private loadTransactions(page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.walletService
      .getWalletTransactions(page, this.pageSize)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
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
    return 'Unable to load wallet transactions right now.';
  }
}
