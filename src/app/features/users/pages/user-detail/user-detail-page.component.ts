import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../auth/data/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { UserDetailView } from '../../data/users.models';
import { UsersService } from '../../data/users.service';

@Component({
  selector: 'app-user-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-4">
      <div class="flex items-center justify-between gap-4 border-b border-[rgba(138,158,191,0.16)] pb-2">
        <div class="grid gap-1">
          <p class="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Teams</p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            User profile
          </h1>
        </div>
        <a
          routerLink="/teams"
          class="rounded-full border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)]"
        >
          Back to teams
        </a>
      </div>

      <article *ngIf="isLoading()" class="merchant-panel rounded-[1.8rem] p-6">
        <p class="m-0 text-sm text-[#61708a]">Loading user details...</p>
      </article>

      <article
        *ngIf="!isLoading() && errorMessage()"
        class="merchant-panel rounded-[1.8rem] border border-[#ffd7d3] bg-[#fff6f5] p-6"
      >
        <p class="m-0 text-sm font-medium text-[#b42318]">{{ errorMessage() }}</p>
      </article>

      <section *ngIf="!isLoading() && user()" class="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_340px]">
        <article class="merchant-panel rounded-[1.8rem] p-6">
          <div class="flex items-start justify-between gap-4 border-b border-[rgba(138,158,191,0.14)] pb-4">
            <div class="grid gap-2">
              <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#8fa0b8]">Team member</p>
              <strong class="text-xl text-[#2f3743]">{{ user()!.fullName }}</strong>
              <span class="text-sm text-[#607089]">{{ user()!.email }}</span>
            </div>
            <span class="status-pill" [class]="user()!.statusTone">{{ user()!.statusText }}</span>
          </div>

          <dl class="mt-5 grid gap-0">
            <div
              class="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-4 border-t border-[rgba(138,158,191,0.14)] py-3 first:border-t-0 first:pt-0"
              *ngFor="let item of detailRows()"
            >
              <dt class="text-xs font-bold uppercase tracking-[0.06em] text-[#7a8aa3]">{{ item.label }}</dt>
              <dd class="m-0 break-words text-sm text-[#2a3340]">{{ item.value }}</dd>
            </div>
          </dl>
        </article>

        <aside class="merchant-panel rounded-[1.8rem] p-6">
          <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">Account summary</p>
          <div class="mt-4 grid gap-4 rounded-[1.4rem] bg-[#f8fbff] p-4">
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">User ID</span>
              <strong class="mt-1 block text-sm text-[#2f3743]">{{ user()!.id }}</strong>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Unique ID</span>
              <strong class="mt-1 block break-all font-mono text-sm text-[#2f3743]">{{ user()!.uniqueId }}</strong>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Merchant ID</span>
              <span class="mt-1 block text-sm text-[#607089]">{{ user()!.merchantId }}</span>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Role ID</span>
              <span class="mt-1 block text-sm text-[#607089]">{{ user()!.roleId }}</span>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Login state</span>
              <span class="mt-1 block text-sm text-[#607089]">{{ user()!.loginStatusText }}</span>
            </div>
          </div>

          <div
            *ngIf="canManageUser()"
            class="mt-5 border-t border-[rgba(138,158,191,0.14)] pt-5"
          >
            <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">
              Account access
            </p>
            <p class="mt-2 mb-0 text-sm leading-6 text-[#607089]">
              Clear this user's failed login attempts and restore sign-in access.
            </p>
            <button
              type="button"
              class="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#16803c] bg-[#1c7f3d] px-4 text-sm font-bold text-white transition hover:bg-[#146b33] disabled:cursor-not-allowed disabled:opacity-65"
              [disabled]="isUnlocking() || isUpdatingStatus()"
              (click)="unlockUser()"
            >
              {{ isUnlocking() ? 'Unlocking...' : 'Unlock user' }}
            </button>
            <button
              type="button"
              class="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-65"
              [ngClass]="
                isActiveUser()
                  ? 'border-[#b42318] bg-[#b42318] text-white hover:bg-[#912018]'
                  : 'border-[#16803c] bg-white text-[#16803c] hover:bg-[#f0fdf4]'
              "
              [disabled]="isUnlocking() || isUpdatingStatus()"
              (click)="toggleUserStatus()"
            >
              {{ statusActionLabel() }}
            </button>
            <p
              *ngIf="unlockErrorMessage()"
              class="mt-3 mb-0 text-sm font-medium text-[#b42318]"
              role="alert"
            >
              {{ unlockErrorMessage() }}
            </p>
            <p
              *ngIf="statusErrorMessage()"
              class="mt-3 mb-0 text-sm font-medium text-[#b42318]"
              role="alert"
            >
              {{ statusErrorMessage() }}
            </p>
          </div>
        </aside>
      </section>
    </main>
  `
})
export class UserDetailPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  protected readonly user = signal<UserDetailView | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly isUnlocking = signal(false);
  protected readonly unlockErrorMessage = signal('');
  protected readonly isUpdatingStatus = signal(false);
  protected readonly statusErrorMessage = signal('');

  protected canManageUser(): boolean {
    const permissions = this.authService.getSession()?.permissions ?? [];
    return (
      permissions.includes('ROLE_ADMIN') ||
      permissions.includes('ROLE_MERCHANT_ADMIN') ||
      permissions.includes('ROLE_UPDATE_USERS')
    );
  }

  protected isActiveUser(): boolean {
    return this.user()?.statusText.toLowerCase() === 'active';
  }

  protected statusActionLabel(): string {
    if (this.isUpdatingStatus()) {
      return this.isActiveUser() ? 'Disabling...' : 'Enabling...';
    }
    return this.isActiveUser() ? 'Disable user' : 'Enable user';
  }

  protected toggleUserStatus(): void {
    const uniqueId = this.user()?.uniqueId.trim() ?? '';
    if (!uniqueId || uniqueId === '—' || this.isUpdatingStatus() || this.isUnlocking()) {
      return;
    }

    const enabling = !this.isActiveUser();
    this.isUpdatingStatus.set(true);
    this.statusErrorMessage.set('');

    this.usersService
      .setUserEnabled({ uniqueId, status: enabling ? '1' : '2' })
      .pipe(finalize(() => this.isUpdatingStatus.set(false)))
      .subscribe({
        next: () => {
          this.toastService.show(
            `User ${enabling ? 'enabled' : 'disabled'} successfully.`,
            'success'
          );
          this.loadUser(uniqueId);
        },
        error: (error: unknown) => {
          this.statusErrorMessage.set(
            this.resolveErrorMessage(
              error,
              `Unable to ${enabling ? 'enable' : 'disable'} this user right now.`
            )
          );
        }
      });
  }

  protected unlockUser(): void {
    const uniqueId = this.user()?.uniqueId.trim() ?? '';
    if (!uniqueId || uniqueId === '—' || this.isUnlocking()) {
      return;
    }

    this.isUnlocking.set(true);
    this.unlockErrorMessage.set('');

    this.usersService
      .unlockUser({ uniqueId })
      .pipe(finalize(() => this.isUnlocking.set(false)))
      .subscribe({
        next: () => {
          this.toastService.show('User unlocked successfully.', 'success');
          this.loadUser(uniqueId);
        },
        error: (error: unknown) => {
          this.unlockErrorMessage.set(
            this.resolveErrorMessage(error, 'Unable to unlock this user right now.')
          );
        }
      });
  }

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const uniqueId = params.get('uniqueId') ?? '';
        this.loadUser(uniqueId);
      });
  }

  protected detailRows(): { label: string; value: string }[] {
    const user = this.user();
    if (!user) {
      return [];
    }

    return [
      { label: 'Phone', value: user.phone },
      { label: 'Username', value: user.username },
      { label: 'Category', value: user.userCategory },
      { label: 'Two factor', value: user.twoFactorText },
      { label: 'Login attempts', value: user.loginAttempts },
      { label: 'Last login', value: user.lastLogin },
      { label: 'Failed login', value: user.failedLoginDate },
      { label: 'Locked date', value: user.lockedDate },
      { label: 'Password changed', value: user.passwordChangedOn },
      { label: 'Created', value: user.createdDate },
      { label: 'Updated', value: user.updatedDate },
      { label: 'Created by', value: user.createdBy },
      { label: 'Updated by', value: user.updatedBy }
    ];
  }

  private resolveErrorMessage(
    error: unknown,
    fallback = 'Unable to load this user right now.'
  ): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
      if (error.status === 404) {
        return 'User not found.';
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

  private loadUser(uniqueId: string): void {
    this.user.set(null);
    this.errorMessage.set('');

    if (!uniqueId.trim()) {
      this.isLoading.set(false);
      this.errorMessage.set('Missing user unique ID.');
      return;
    }

    this.isLoading.set(true);

    this.usersService
      .getUser(uniqueId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (user) => this.user.set(user),
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.user.set(null);
        }
      });
  }
}
