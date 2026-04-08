import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { buildPageLinkIndices, buildPaginationRangeSummary } from '../../utils/pagination.utils';

@Component({
  selector: 'app-table-pagination',
  standalone: true,
  template: `
    <footer class="table-pagination">
      <p class="table-pagination__summary">{{ summary() }}</p>
      <nav class="table-pagination__nav" [attr.aria-label]="ariaLabel()">
        <button
          type="button"
          class="table-pagination__btn"
          (click)="emitPrevious()"
          [disabled]="!canGoPrevious()"
        >
          Previous
        </button>

        <div class="table-pagination__pages">
          @for (p of pageLinks(); track p) {
            <button
              type="button"
              class="table-pagination__page-link"
              [class.table-pagination__page-link--active]="p === currentPage()"
              [attr.aria-current]="p === currentPage() ? 'page' : null"
              (click)="emitPage(p)"
              [disabled]="disabled()"
            >
              {{ p + 1 }}
            </button>
          }
        </div>

        <span class="table-pagination__indicator table-pagination__indicator--mobile">
          Page {{ displayPage() }} of {{ displayTotalPages() }}
        </span>

        <button
          type="button"
          class="table-pagination__btn"
          (click)="emitNext()"
          [disabled]="!canGoNext()"
        >
          Next
        </button>
      </nav>
    </footer>
  `,
  styles: `
    .table-pagination {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem 1rem;
      padding: 1rem 1.55rem 1.25rem;
      border-top: 1px solid rgba(138, 158, 191, 0.14);
      background: rgba(252, 253, 255, 0.65);
    }

    .table-pagination__summary {
      margin: 0;
      color: #5f6d85;
      font-size: 0.88rem;
    }

    .table-pagination__nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.65rem 1rem;
    }

    .table-pagination__pages {
      display: none;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
    }

    @media (min-width: 768px) {
      .table-pagination__pages {
        display: flex;
      }

      .table-pagination__indicator--mobile {
        display: none;
      }
    }

    .table-pagination__indicator {
      color: #2f3743;
      font-size: 0.88rem;
      font-weight: 600;
      min-width: 7.5rem;
      text-align: center;
    }

    .table-pagination__page-link {
      min-width: 2.25rem;
      height: 2.25rem;
      padding: 0 0.45rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(138, 158, 191, 0.35);
      background: #fff;
      color: #3d4d63;
      font-size: 0.86rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        background 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease,
        opacity 0.15s ease;
    }

    .table-pagination__page-link:hover:not(:disabled):not(.table-pagination__page-link--active) {
      border-color: color-mix(in srgb, var(--primary) 45%, transparent);
      color: var(--primary);
      background: color-mix(in srgb, var(--primary) 6%, transparent);
    }

    .table-pagination__page-link--active {
      border-color: var(--primary);
      background: var(--primary);
      color: #fff;
      cursor: default;
    }

    .table-pagination__page-link:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .table-pagination__page-link--active:disabled {
      opacity: 1;
      cursor: default;
    }

    .table-pagination__btn {
      padding: 0.5rem 1rem;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent);
      background: #fff;
      color: var(--primary);
      font-size: 0.86rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        background 0.15s ease,
        opacity 0.15s ease;
    }

    .table-pagination__btn:hover:not(:disabled) {
      background: color-mix(in srgb, var(--primary) 8%, transparent);
    }

    .table-pagination__btn:disabled {
      opacity: 0.38;
      cursor: not-allowed;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TablePaginationComponent {
  /** Zero-based index from the API. */
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  totalItems = input.required<number>();
  pageSize = input.required<number>();
  /** When true, disables prev/next (e.g. while a page request is in flight). */
  disabled = input(false);
  ariaLabel = input('Table pages');
  /** Max numbered links on wide viewports (default 5). */
  maxPageLinks = input(5);

  previous = output<void>();
  next = output<void>();
  /** Zero-based page index when a numbered link is activated. */
  pageSelect = output<number>();

  protected readonly summary = computed(() =>
    buildPaginationRangeSummary(this.currentPage(), this.pageSize(), this.totalItems())
  );

  protected readonly displayPage = computed(() => this.currentPage() + 1);

  protected readonly displayTotalPages = computed(() => Math.max(1, this.totalPages()));

  protected readonly pageLinks = computed(() =>
    buildPageLinkIndices(this.currentPage(), this.totalPages(), this.maxPageLinks())
  );

  protected readonly canGoPrevious = computed(
    () => this.currentPage() > 0 && !this.disabled()
  );

  protected readonly canGoNext = computed(() => {
    const total = this.totalPages();
    return total > 0 && this.currentPage() + 1 < total && !this.disabled();
  });

  protected emitPrevious(): void {
    if (this.canGoPrevious()) {
      this.previous.emit();
    }
  }

  protected emitNext(): void {
    if (this.canGoNext()) {
      this.next.emit();
    }
  }

  protected emitPage(page: number): void {
    if (this.disabled() || page === this.currentPage()) {
      return;
    }
    this.pageSelect.emit(page);
  }
}
