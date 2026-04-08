import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-transaction-table-skeleton',
  standalone: true,
  template: `
    <div class="table-skeleton" role="status" aria-live="polite">
      <span class="table-skeleton__sr">{{ statusMessage() }}</span>
      @for (i of rowIndices(); track i) {
        <div class="transaction-row table-skeleton__row">
          <div class="customer-cell table-skeleton__customer">
            <div class="table-skeleton__avatar"></div>
            <div class="table-skeleton__lines">
              <div class="table-skeleton__line table-skeleton__line--primary"></div>
              <div class="table-skeleton__line table-skeleton__line--secondary"></div>
            </div>
          </div>
          <div class="table-skeleton__pill"></div>
          <div class="table-skeleton__line table-skeleton__line--amount"></div>
          <div class="table-skeleton__line table-skeleton__line--date"></div>
        </div>
      }
    </div>
  `,
  styles: `
    @keyframes table-skeleton-shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    .table-skeleton__sr {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .table-skeleton {
      position: relative;
    }

    .table-skeleton__row + .table-skeleton__row {
      border-top: 1px solid rgba(138, 158, 191, 0.14);
    }

    .table-skeleton__customer {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      min-width: 0;
    }

    .table-skeleton__avatar,
    .table-skeleton__line,
    .table-skeleton__pill {
      background: linear-gradient(
        90deg,
        rgba(218, 224, 238, 0.75) 0%,
        rgba(244, 246, 252, 0.98) 45%,
        rgba(218, 224, 238, 0.75) 90%
      );
      background-size: 200% 100%;
      animation: table-skeleton-shimmer 1.35s ease-in-out infinite;
    }

    .table-skeleton__avatar {
      width: 2.7rem;
      height: 2.7rem;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .table-skeleton__lines {
      display: grid;
      gap: 0.45rem;
      min-width: 0;
      flex: 1;
    }

    .table-skeleton__line {
      height: 0.78rem;
      border-radius: 0.35rem;
      max-width: 100%;
    }

    .table-skeleton__line--primary {
      width: min(12rem, 68%);
    }

    .table-skeleton__line--secondary {
      width: min(9rem, 48%);
    }

    .table-skeleton__pill {
      height: 1.45rem;
      width: 4.25rem;
      border-radius: 999px;
      justify-self: start;
    }

    .table-skeleton__line--amount {
      width: 3.75rem;
      height: 0.85rem;
    }

    .table-skeleton__line--date {
      width: 3.25rem;
      height: 0.78rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionTableSkeletonComponent {
  /** Number of placeholder rows. */
  rowCount = input(6);
  /** Announced to screen readers. */
  statusMessage = input('Loading transactions');

  protected readonly rowIndices = computed(() =>
    Array.from({ length: Math.max(0, this.rowCount()) }, (_, i) => i)
  );
}
