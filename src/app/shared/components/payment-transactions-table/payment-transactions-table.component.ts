import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TransactionTableSkeletonComponent } from './transaction-table-skeleton.component';

export interface SummaryTableRow {
  route?: string;
  queryParams?: Record<string, string>;
  initials?: string;
  avatarText?: string;
  name?: string;
  primaryText?: string;
  email?: string;
  secondaryText?: string;
  status?: string;
  statusText?: string;
  statusClass?: string;
  statusTone?: string;
  amount?: string;
  amountText?: string;
  transactionType?: string;
  transactionTypeText?: string;
  detail?: string;
  detailText?: string;
  detailTone?: string;
  date?: string;
  metaText?: string;
}

export interface SummaryTableHeaders {
  primary: string;
  status?: string;
  amount?: string;
  meta?: string;
  transactionType?: string;
  detail?: string;
}

@Component({
  selector: 'app-summary-table',
  standalone: true,
  imports: [CommonModule, RouterLink, TransactionTableSkeletonComponent],
  template: `
    <article class="merchant-panel transactions-card" [ngClass]="cardClass()">
      <div
        class="table-head"
        [ngClass]="tableHeadClass()"
        [style.grid-template-columns]="gridTemplateColumns()"
      >
        @for (column of visibleColumns(); track column.key) {
          <span>{{ column.label }}</span>
        }
      </div>

      <app-transaction-table-skeleton
        *ngIf="isLoading()"
        [rowCount]="skeletonRowCount()"
        [statusMessage]="loadingMessage()"
      />

      <ng-container *ngIf="!isLoading()">
        <ng-container *ngIf="detailedState(); else compactState">
          <div
            class="flex min-h-[6.5rem] items-center justify-center px-5 py-6 text-center"
            *ngIf="errorMessage()"
          >
            <p class="m-0 max-w-[28rem] text-[0.95rem] text-[#b42318]">{{ errorMessage() }}</p>
          </div>

          <div
            class="flex flex-col items-center justify-center gap-2 border-t border-[rgba(138,158,191,0.12)] px-6 py-9 text-center"
            *ngIf="!errorMessage() && !rows().length"
          >
            <div
              class="mb-1 grid h-[3.25rem] w-[3.25rem] place-items-center text-[#8b9cbb] opacity-85"
              aria-hidden="true"
            >
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="10" width="32" height="28" rx="3" stroke="currentColor" stroke-width="2" />
                <path d="M8 18h32" stroke="currentColor" stroke-width="2" />
                <circle cx="24" cy="30" r="4" stroke="currentColor" stroke-width="2" />
              </svg>
            </div>
            <p class="m-0 text-[1.05rem] font-bold text-[#2f3743]">{{ emptyTitle() }}</p>
            <p class="m-0 max-w-[22rem] text-[0.9rem] leading-[1.45] text-[#7a8aa3]" *ngIf="emptyHint()">
              {{ emptyHint() }}
            </p>
          </div>
        </ng-container>

        <ng-template #compactState>
          <div class="transaction-row" *ngIf="errorMessage()" [style.grid-template-columns]="gridTemplateColumns()">
            <span>{{ errorMessage() }}</span>
          </div>

          <div
            class="transaction-row"
            *ngIf="!errorMessage() && !rows().length"
            [style.grid-template-columns]="gridTemplateColumns()"
          >
            <span>{{ emptyTitle() }}</span>
          </div>
        </ng-template>

        @for (row of rows(); track $index) {
          @if (row.route) {
            <a
              class="transaction-row"
              [routerLink]="row.route"
              [queryParams]="row.queryParams"
              [style.grid-template-columns]="gridTemplateColumns()"
            >
              <div class="customer-cell">
                <div class="customer-avatar">{{ avatarText(row) }}</div>
                <div>
                  <strong>{{ primaryText(row) }}</strong>
                  <span>{{ secondaryText(row) }}</span>
                </div>
              </div>

              @if (showsColumn('status')) {
                <span class="status-pill" [class]="statusClass(row)">
                  {{ statusText(row) }}
                </span>
              }

              @if (showsColumn('amount')) {
                <strong class="amount-cell">{{ amountText(row) }}</strong>
              }

              @if (showsColumn('transactionType')) {
                <span class="transaction-type-cell">{{ transactionTypeText(row) }}</span>
              }

              @if (showsColumn('detail')) {
                <span class="status-pill" [class]="detailClass(row)">{{ detailText(row) }}</span>
              }

              @if (showsColumn('meta')) {
                <span class="date-cell">{{ metaText(row) }}</span>
              }
            </a>
          } @else {
            <div
              class="transaction-row"
              [style.grid-template-columns]="gridTemplateColumns()"
            >
              <div class="customer-cell">
                <div class="customer-avatar">{{ avatarText(row) }}</div>
                <div>
                  <strong>{{ primaryText(row) }}</strong>
                  <span>{{ secondaryText(row) }}</span>
                </div>
              </div>

              @if (showsColumn('status')) {
                <span class="status-pill" [class]="statusClass(row)">
                  {{ statusText(row) }}
                </span>
              }

              @if (showsColumn('amount')) {
                <strong class="amount-cell">{{ amountText(row) }}</strong>
              }

              @if (showsColumn('transactionType')) {
                <span class="transaction-type-cell">{{ transactionTypeText(row) }}</span>
              }

              @if (showsColumn('detail')) {
                <span class="status-pill" [class]="detailClass(row)">{{ detailText(row) }}</span>
              }

              @if (showsColumn('meta')) {
                <span class="date-cell">{{ metaText(row) }}</span>
              }
            </div>
          }
        }
      </ng-container>

      <ng-content />
    </article>
  `
})
export class SummaryTableComponent {
  rows = input.required<SummaryTableRow[]>();
  headers = input.required<SummaryTableHeaders>();
  isLoading = input(false);
  errorMessage = input('');
  loadingMessage = input('Loading payment transactions...');
  emptyTitle = input('No payment transactions found.');
  emptyHint = input('');
  detailedState = input(false);
  cardClass = input('');
  tableHeadClass = input('');
  /** Placeholder rows while `isLoading()` is true. */
  skeletonRowCount = input(6);
  protected readonly visibleColumns = computed(() => {
    const headers = this.headers();
    return [
      { key: 'primary', label: headers.primary },
      ...(headers.status ? [{ key: 'status', label: headers.status }] : []),
      ...(headers.amount ? [{ key: 'amount', label: headers.amount }] : []),
      ...(headers.transactionType ? [{ key: 'transactionType', label: headers.transactionType }] : []),
      ...(headers.detail ? [{ key: 'detail', label: headers.detail }] : []),
      ...(headers.meta ? [{ key: 'meta', label: headers.meta }] : [])
    ];
  });
  protected readonly gridTemplateColumns = computed(() =>
    this.visibleColumns()
      .map((column) => this.columnWidth(column.key))
      .join(' ')
  );

  protected avatarText(row: SummaryTableRow): string {
    return row.avatarText || row.initials || '--';
  }

  protected primaryText(row: SummaryTableRow): string {
    return row.primaryText || row.name || 'Unknown';
  }

  protected secondaryText(row: SummaryTableRow): string {
    return row.secondaryText || row.email || '';
  }

  protected statusText(row: SummaryTableRow): string {
    return row.statusText || row.status || 'Unknown';
  }

  protected statusClass(row: SummaryTableRow): string {
    return row.statusTone || row.statusClass || 'pending';
  }

  protected amountText(row: SummaryTableRow): string {
    return row.amountText || row.amount || '--';
  }

  protected transactionTypeText(row: SummaryTableRow): string {
    return row.transactionTypeText || row.transactionType || '--';
  }

  protected detailText(row: SummaryTableRow): string {
    return row.detailText || row.detail || '--';
  }

  protected detailClass(row: SummaryTableRow): string {
    return row.detailTone || 'pending';
  }

  protected metaText(row: SummaryTableRow): string {
    return row.metaText || row.date || '--';
  }

  protected showsColumn(columnKey: string): boolean {
    return this.visibleColumns().some((column) => column.key === columnKey);
  }

  private columnWidth(columnKey: string): string {
    switch (columnKey) {
      case 'primary':
        return 'minmax(0, 1.7fr)';
      case 'status':
        return '0.85fr';
      case 'amount':
        return '0.8fr';
      case 'transactionType':
        return '0.9fr';
      case 'detail':
        return '0.9fr';
      case 'meta':
        return '0.45fr';
      default:
        return '1fr';
    }
  }
}
