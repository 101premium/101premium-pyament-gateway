import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
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
import { RolesService } from '../../data/roles.service';
import { UsersService } from '../../data/users.service';
import { RoleStatData, UserStatData } from '../../data/users.models';
import { PageFooterComponent } from '../../../../shared/components/page-footer/page-footer.component';
import { AuthService } from '../../../auth/data/auth.service';

type UserTab = 'users' | 'roles';

@Component({
  selector: 'app-user-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SummaryTableComponent, TablePaginationComponent, PageFooterComponent],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-3">
      <div
        class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5"
      >
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">
            Users
          </p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Users and roles
          </h1>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-3">
          <button
            *ngIf="canViewUsers()"
            type="button"
            class="min-h-11 rounded-full px-5 text-sm font-semibold transition"
            [class.ui-tab-pill-active]="activeTab() === 'users'"
            [class.bg-white]="activeTab() !== 'users'"
            [class.text-[#43536d]]="activeTab() !== 'users'"
            [class.border]="activeTab() !== 'users'"
            [class.border-[rgba(138,158,191,0.28)]]="activeTab() !== 'users'"
            (click)="setActiveTab('users')"
          >
            Users
          </button>

          <button
            *ngIf="canViewRoles()"
            type="button"
            class="min-h-11 rounded-full px-5 text-sm font-semibold transition"
            [class.ui-tab-pill-active]="activeTab() === 'roles'"
            [class.bg-white]="activeTab() !== 'roles'"
            [class.text-[#43536d]]="activeTab() !== 'roles'"
            [class.border]="activeTab() !== 'roles'"
            [class.border-[rgba(138,158,191,0.28)]]="activeTab() !== 'roles'"
            (click)="setActiveTab('roles')"
          >
            Roles
          </button>
        </div>

        <a
          *ngIf="activeTab() === 'users' && canCreateUsers()"
          routerLink="/teams/users/new"
          class="primary-btn min-w-[180px]"
        >
          Add User
        </a>

        <a
          *ngIf="activeTab() === 'roles' && canManageRoles()"
          routerLink="/teams/roles/new"
          class="primary-btn min-w-[180px]"
        >
          Add Role
        </a>
      </div>

      <p
        *ngIf="activeTab() === 'users' && userStatsError()"
        class="m-0 rounded-[10px] border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[0.82rem] text-[#b91c1c]"
      >
        {{ userStatsError() }}
      </p>

      <section
        *ngIf="activeTab() === 'users' && userStatsLoading()"
        class="merchant-stats"
        aria-busy="true"
      >
        <article
          class="merchant-stat-card"
          *ngFor="let _ of userStatSkeletonSlots"
          data-stat-tone="muted"
        >
          <p class="stat-label text-[#9aa6bd]">Overview</p>
          <strong class="text-[#cbd5e1]">—</strong>
          <span class="text-transparent select-none">.</span>
        </article>
      </section>

      <section
        *ngIf="activeTab() === 'users' && !userStatsLoading() && userStatCards().length > 0"
        class="merchant-stats"
      >
        <article
          class="merchant-stat-card"
          *ngFor="let stat of userStatCards()"
          [attr.data-stat-tone]="stat.tone"
        >
          <p class="stat-label">{{ stat.label }}</p>
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.note }}</span>
        </article>
      </section>

      <p
        *ngIf="activeTab() === 'roles' && roleStatsError()"
        class="m-0 rounded-[10px] border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-[0.82rem] text-[#b91c1c]"
      >
        {{ roleStatsError() }}
      </p>

      <section
        *ngIf="activeTab() === 'roles' && roleStatsLoading()"
        class="merchant-stats"
        aria-busy="true"
      >
        <article
          class="merchant-stat-card"
          *ngFor="let _ of roleStatSkeletonSlots"
          data-stat-tone="muted"
        >
          <p class="stat-label text-[#9aa6bd]">Overview</p>
          <strong class="text-[#cbd5e1]">—</strong>
          <span class="text-transparent select-none">.</span>
        </article>
      </section>

      <section
        *ngIf="activeTab() === 'roles' && !roleStatsLoading() && roleStatCards().length > 0"
        class="merchant-stats"
      >
        <article
          class="merchant-stat-card"
          *ngFor="let stat of roleStatCards()"
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
          [headers]="tableHeaders()"
          [isLoading]="isLoading()"
          [errorMessage]="errorMessage()"
          [loadingMessage]="loadingMessage()"
          [emptyTitle]="emptyTitle()"
          [emptyHint]="emptyHint()"
          [detailedState]="true"
          [cardClass]="'payment-transactions-card'"
          [tableHeadClass]="'!text-[#4a5a73] !text-[0.72rem] !font-bold !tracking-[0.12em] bg-[rgba(248,250,253,0.95)]'"
        >
          <app-table-pagination
            *ngIf="!isLoading() && !errorMessage() && totalItems() > 0"
            [ariaLabel]="'User pages'"
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
export class UserHomePageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly merchantSearch = inject(MerchantSearchService);
  private readonly authService = inject(AuthService);
  protected readonly pageSize = 10;

  protected readonly activeTab = signal<UserTab>('users');

  protected canViewUsers(): boolean {
    return this.hasAnyPermission(
      'ROLE_ADMIN',
      'ROLE_MERCHANT_ADMIN',
      'ROLE_VIEW_MERCHANT_USERS',
      'ROLE_CREATE_MERCHANT_USERS',
      'ROLE_VIEW_USERS',
      'ROLE_CREATE_USERS',
      'ROLE_UPDATE_USERS'
    );
  }

  protected canCreateUsers(): boolean {
    return this.hasAnyPermission(
      'ROLE_ADMIN',
      'ROLE_MERCHANT_ADMIN',
      'ROLE_CREATE_MERCHANT_USERS',
      'ROLE_CREATE_USERS'
    );
  }

  protected canViewRoles(): boolean {
    return this.hasAnyPermission(
      'ROLE_ADMIN',
      'ROLE_MERCHANT_ADMIN',
      'ROLE_VIEW_MERCHANT_ROLE',
      'ROLE_UPDATE_MERCHANT_ROLE',
      'ROLE_CREATE_MERCHANT_ROLE',
      'ROLE_VIEW_ROLE',
      'ROLE_UPDATE_ROLE',
      'ROLE_CREATE_ROLE',
      'ROLE_ASSIGN_PERMISSION',
      'ROLE_ENABLE/DSIABLE_ROLE'
    );
  }

  protected canManageRoles(): boolean {
    return this.hasAnyPermission(
      'ROLE_ADMIN',
      'ROLE_MERCHANT_ADMIN',
      'ROLE_CREATE_MERCHANT_ROLE',
      'ROLE_CREATE_ROLE',
      'ROLE_ASSIGN_PERMISSION'
    );
  }
  protected readonly userStats = signal<UserStatData | null>(null);
  protected readonly userStatsLoading = signal(false);
  protected readonly userStatsError = signal('');
  protected readonly userStatSkeletonSlots = [0, 1, 2, 3];
  protected readonly userStatCards = computed(() => {
    const s = this.userStats();
    if (!s) {
      return [];
    }
    return [
      { label: 'Total users', value: s.totalUser, note: 'All accounts', tone: 'neutral' as const },
      { label: 'Active', value: s.activeUser, note: 'Currently active', tone: 'positive' as const },
      { label: 'Inactive', value: s.inactiveUsers, note: 'Inactive accounts', tone: 'muted' as const },
      {
        label: 'Deactivated',
        value: s.deactivatedUsers,
        note: 'Deactivated accounts',
        tone: 'warning' as const
      }
    ];
  });

  protected readonly roleStats = signal<RoleStatData | null>(null);
  protected readonly roleStatsLoading = signal(false);
  protected readonly roleStatsError = signal('');
  protected readonly roleStatSkeletonSlots = [0, 1, 2];
  protected readonly roleStatCards = computed(() => {
    const s = this.roleStats();
    if (!s) {
      return [];
    }
    return [
      { label: 'Total roles', value: s.total, note: 'All roles', tone: 'neutral' as const },
      { label: 'Active', value: s.active, note: 'Currently active', tone: 'positive' as const },
      { label: 'Inactive', value: s.inactive, note: 'Inactive roles', tone: 'muted' as const }
    ];
  });

  protected readonly tableRows = signal<SummaryTableRow[]>([]);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalItems = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly tableHeaders = computed<SummaryTableHeaders>(() =>
    this.activeTab() === 'users'
      ? {
          primary: 'User',
          amount: 'Role'
        }
      : {
          primary: 'Role',
          status: 'Status',
          meta: 'Created'
        }
  );
  protected readonly loadingMessage = computed(() =>
    this.activeTab() === 'users' ? 'Loading users...' : 'Loading roles...'
  );
  protected readonly emptyTitle = computed(() =>
    this.activeTab() === 'users' ? 'No users found' : 'No roles found'
  );
  protected readonly emptyHint = computed(() =>
    this.activeTab() === 'users'
      ? 'Try another search or return later when more team members are available.'
      : 'Try another search or return later when more roles are available.'
  );

  constructor() {
    if (!this.canViewUsers() && this.canViewRoles()) {
      this.activeTab.set('roles');
      this.loadRoleStats();
    } else {
      this.loadUserStats();
    }

    this.merchantSearch.debouncedQuery$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((searchParam) => this.loadActiveTab(searchParam, 0));
  }

  private hasAnyPermission(...required: string[]): boolean {
    const permissions = this.authService.getSession()?.permissions ?? [];
    return required.some((permission) => permissions.includes(permission));
  }

  protected goToPreviousPage(): void {
    if (this.currentPage() <= 0 || this.isLoading()) {
      return;
    }
    this.loadActiveTab(this.merchantSearch.control.getRawValue(), this.currentPage() - 1);
  }

  protected goToNextPage(): void {
    const total = this.totalPages();
    if (this.isLoading() || total <= 0 || this.currentPage() + 1 >= total) {
      return;
    }
    this.loadActiveTab(this.merchantSearch.control.getRawValue(), this.currentPage() + 1);
  }

  protected goToPage(page: number): void {
    const total = this.totalPages();
    if (this.isLoading() || page < 0 || page >= total || page === this.currentPage()) {
      return;
    }
    this.loadActiveTab(this.merchantSearch.control.getRawValue(), page);
  }

  protected setActiveTab(tab: UserTab): void {
    if (this.activeTab() === tab || this.isLoading()) {
      return;
    }

    this.activeTab.set(tab);
    if (tab === 'roles') {
      this.loadRoleStats();
    } else {
      this.loadUserStats();
    }
    this.loadActiveTab(this.merchantSearch.control.getRawValue(), 0);
  }

  private loadActiveTab(searchParam: string, page: number): void {
    if (this.activeTab() === 'roles') {
      this.loadRoles(searchParam, page);
      return;
    }

    this.loadUsers(searchParam, page);
  }

  private loadUsers(searchParam: string, page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.usersService
      .getUsers({
        searchParam,
        page,
        size: this.pageSize
      })
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

  private loadUserStats(): void {
    this.userStatsLoading.set(true);
    this.userStatsError.set('');

    this.usersService
      .getUserStat()
      .pipe(finalize(() => this.userStatsLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.userStats.set(data);
          this.userStatsError.set('');
        },
        error: (error: unknown) => {
          this.userStats.set(null);
          this.userStatsError.set(this.resolveErrorMessage(error, 'Unable to load user overview.'));
        }
      });
  }

  private loadRoleStats(): void {
    this.roleStatsLoading.set(true);
    this.roleStatsError.set('');

    this.rolesService
      .getRoleStat()
      .pipe(finalize(() => this.roleStatsLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.roleStats.set(data);
          this.roleStatsError.set('');
        },
        error: (error: unknown) => {
          this.roleStats.set(null);
          this.roleStatsError.set(this.resolveErrorMessage(error, 'Unable to load role overview.'));
        }
      });
  }

  private loadRoles(searchParam: string, page: number): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.rolesService
      .getRoles({
        searchParam,
        page,
        size: this.pageSize
      })
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

  private resolveErrorMessage(error: unknown, fallback = 'Unable to load users right now.'): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }

      if (error.status === 401) {
        return 'User session expired. Please sign in again.';
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return fallback;
  }
}
