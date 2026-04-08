import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { MerchantDetailView } from '../../data/merchant.models';
import { MerchantService } from '../../data/merchant.service';

@Component({
  selector: 'app-merchant-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="dashboard-main merchant-main grid gap-x-5 gap-y-4">
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(138,158,191,0.16)] pb-2"
      >
        <div class="grid gap-1">
          <p class="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Merchants</p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Merchant profile
          </h1>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            *ngIf="canApproveMerchant()"
            type="button"
            class="primary-btn whitespace-nowrap px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="isApproving()"
            (click)="openApproveConfirmModal()"
          >
            Approve merchant
          </button>
          <button
            *ngIf="canDisableMerchant()"
            type="button"
            class="whitespace-nowrap rounded-full border border-[#fecaca] bg-white px-5 py-2.5 text-sm font-semibold text-[#b42318] shadow-sm transition hover:bg-[#fff1f2] disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="isStatusUpdating()"
            (click)="setMerchantEnabled(false)"
          >
            {{ isStatusUpdating() ? 'Updating…' : 'Disable merchant' }}
          </button>
          <button
            *ngIf="canEnableMerchant()"
            type="button"
            class="primary-btn whitespace-nowrap px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="isStatusUpdating()"
            (click)="setMerchantEnabled(true)"
          >
            {{ isStatusUpdating() ? 'Updating…' : 'Enable merchant' }}
          </button>
          <a
            routerLink="/merchants"
            class="rounded-full border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)]"
          >
            Back to merchants
          </a>
        </div>
      </div>

      <div
        *ngIf="approvalError()"
        class="rounded-[1rem] border border-[#ffd7d3] bg-[#fff6f5] px-4 py-3 text-sm font-medium text-[#b42318]"
      >
        {{ approvalError() }}
      </div>

      <div
        *ngIf="statusToggleError()"
        class="rounded-[1rem] border border-[#ffd7d3] bg-[#fff6f5] px-4 py-3 text-sm font-medium text-[#b42318]"
      >
        {{ statusToggleError() }}
      </div>

      <article *ngIf="isLoading()" class="merchant-panel rounded-[1.8rem] p-6">
        <p class="m-0 text-sm text-[#61708a]">Loading merchant details...</p>
      </article>

      <article
        *ngIf="!isLoading() && errorMessage()"
        class="merchant-panel rounded-[1.8rem] border border-[#ffd7d3] bg-[#fff6f5] p-6"
      >
        <p class="m-0 text-sm font-medium text-[#b42318]">{{ errorMessage() }}</p>
      </article>

      <section *ngIf="!isLoading() && merchant()" class="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_340px]">
        <article class="merchant-panel rounded-[1.8rem] p-6">
          <div class="flex items-start justify-between gap-4 border-b border-[rgba(138,158,191,0.14)] pb-4">
            <div class="grid gap-2">
              <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#8fa0b8]">Business</p>
              <strong class="text-xl text-[#2f3743]">{{ merchant()!.businessName }}</strong>
              <span class="text-sm text-[#607089]">{{ merchant()!.businessEmail }}</span>
            </div>
            <span class="status-pill" [class]="merchant()!.statusTone">{{ merchant()!.statusText }}</span>
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
          <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">Identifiers</p>
          <div class="mt-4 grid gap-4 rounded-[1.4rem] bg-[#f8fbff] p-4">
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Merchant ID</span>
              <strong class="mt-1 block font-mono text-sm text-[#2f3743]">{{ merchant()!.merchantId }}</strong>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Unique ID</span>
              <strong class="mt-1 block break-all font-mono text-sm text-[#2f3743]">{{ merchant()!.uniqueId }}</strong>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Record ID</span>
              <span class="mt-1 block text-sm text-[#607089]">{{ merchant()!.internalId }}</span>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">API keys</span>
              <span class="mt-1 block text-sm text-[#607089]">Live: {{ merchant()!.apiKeySummary }}</span>
              <span class="mt-1 block text-sm text-[#607089]">Test: {{ merchant()!.testApiKeySummary }}</span>
            </div>
          </div>
        </aside>
      </section>
    </main>

    <!-- Native <dialog> uses the top layer so it is not clipped by dashboard overflow (merchant-main-column). -->
    <dialog
      #approveDialog
      class="merchant-approve-dialog"
      (cancel)="onApproveDialogCancel($event)"
    >
      <div
        class="flex min-h-[100dvh] w-full items-center justify-center bg-[rgba(15,23,42,0.45)] p-4"
        (click)="onApproveOverlayClick($event)"
      >
        <div
          class="w-full max-w-[420px] rounded-[1.35rem] border border-[rgba(138,158,191,0.22)] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
          (click)="$event.stopPropagation()"
          role="document"
        >
          <h2
            id="approve-merchant-dialog-title"
            class="m-0 text-lg font-bold leading-snug tracking-[-0.02em] text-[#1e293b]"
          >
            Approve this merchant?
          </h2>
          <p class="mt-3 mb-0 text-sm leading-relaxed text-[#64748b]">
            You are about to approve
            <strong class="font-semibold text-[#334155]">{{ merchant()?.businessName }}</strong>
            . They will be able to operate as an active merchant. This action should match your
            compliance review.
          </p>
          <div class="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-[rgba(138,158,191,0.35)] bg-white px-5 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
              [disabled]="isApproving()"
              (click)="closeApproveConfirmModal()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="primary-btn px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              [disabled]="isApproving()"
              (click)="confirmApproveMerchant()"
            >
              {{ isApproving() ? 'Approving…' : 'Yes, approve merchant' }}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  `,
  styles: `
    .merchant-approve-dialog {
      margin: 0;
      max-height: 100dvh;
      max-width: 100dvw;
      width: 100%;
      height: 100%;
      border: none;
      padding: 0;
      background: transparent;
    }
    .merchant-approve-dialog::backdrop {
      background: transparent;
    }
  `
})
export class MerchantDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly merchantService = inject(MerchantService);
  private readonly approveDialogRef = viewChild<ElementRef<HTMLDialogElement>>('approveDialog');

  protected readonly merchant = signal<MerchantDetailView | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly isApproving = signal(false);
  protected readonly approvalError = signal('');
  protected readonly isStatusUpdating = signal(false);
  protected readonly statusToggleError = signal('');

  /** True when API says this merchant still needs approval (`approved` normalized to `"0"`). */
  protected readonly canApproveMerchant = computed(() => this.merchant()?.approved === '0');

  /** Active merchants (`status` `"1"`) can be disabled. */
  protected readonly canDisableMerchant = computed(() => {
    const m = this.merchant();
    return m?.status === '1';
  });

  /** Inactive merchants (`status` `"2"`) can be enabled. */
  protected readonly canEnableMerchant = computed(() => {
    const m = this.merchant();
    return m?.status === '2';
  });

  constructor() {
    const uniqueId = this.route.snapshot.paramMap.get('uniqueId') ?? '';

    if (!uniqueId.trim()) {
      this.isLoading.set(false);
      this.errorMessage.set('Missing merchant unique ID.');
      return;
    }

    this.merchantService
      .getMerchant(uniqueId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (detail: MerchantDetailView) => {
          this.approvalError.set('');
          this.statusToggleError.set('');
          this.merchant.set(detail);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveErrorMessage(error));
          this.merchant.set(null);
        }
      });
  }

  /**
   * Enable (`"1"`) or disable (`"2"`) merchant via `PUT …/merchant/enabledisenable`.
   */
  protected setMerchantEnabled(enable: boolean): void {
    const m = this.merchant();
    const uniqueId = m?.uniqueId?.trim();
    if (!uniqueId || uniqueId === '—') {
      return;
    }

    const nextStatus = enable ? '1' : '2';
    this.statusToggleError.set('');
    this.isStatusUpdating.set(true);

    this.merchantService
      .enableDisableMerchant({ uniqueId, status: nextStatus })
      .pipe(
        switchMap(() => this.merchantService.getMerchant(uniqueId)),
        finalize(() => this.isStatusUpdating.set(false))
      )
      .subscribe({
        next: (detail) => this.merchant.set(detail),
        error: (error: unknown) => this.statusToggleError.set(this.resolveStatusToggleError(error))
      });
  }

  protected disableMerchant(): void {
    this.setMerchantEnabled(false);
  }

  protected enableMerchant(): void {
    this.setMerchantEnabled(true);
  }

  protected openApproveConfirmModal(): void {
    if (!this.canApproveMerchant()) {
      return;
    }
    this.approvalError.set('');
    queueMicrotask(() => {
      const el = this.approveDialogRef()?.nativeElement;
      if (el && !el.open) {
        el.showModal();
      }
    });
  }

  protected approveMerchant(): void {
    this.openApproveConfirmModal();
  }

  protected closeApproveConfirmModal(): void {
    if (this.isApproving()) {
      return;
    }
    this.approveDialogRef()?.nativeElement.close();
  }

  protected onApproveDialogCancel(event: Event): void {
    if (this.isApproving()) {
      event.preventDefault();
    }
  }

  protected onApproveOverlayClick(event: MouseEvent): void {
    if (this.isApproving()) {
      return;
    }
    if (event.target === event.currentTarget) {
      this.closeApproveConfirmModal();
    }
  }

  protected confirmApproveMerchant(): void {
    const m = this.merchant();
    const uniqueId = m?.uniqueId?.trim();
    if (!uniqueId || uniqueId === '—') {
      return;
    }

    this.approvalError.set('');
    this.isApproving.set(true);

    this.merchantService
      .approveRejectMerchant({
        uniqueId,
        approve: '1',
        reason: ''
      })
      .pipe(
        switchMap(() => this.merchantService.getMerchant(uniqueId)),
        finalize(() => {
          this.isApproving.set(false);
          this.approveDialogRef()?.nativeElement.close();
        })
      )
      .subscribe({
        next: (detail) => this.merchant.set(detail),
        error: (error: unknown) => this.approvalError.set(this.resolveApprovalError(error))
      });
  }

  protected detailRows(): { label: string; value: string }[] {
    const m = this.merchant();
    if (!m) {
      return [];
    }
    return [
      { label: 'Phone', value: m.businessPhone },
      { label: 'Address', value: m.businessAddress },
      { label: 'CAC', value: m.cacNumber },
      { label: 'TIN', value: m.tinNumber },
      ...(m.reason ? [{ label: 'Reason', value: m.reason }] : []),
      { label: 'Created', value: m.createdDate },
      { label: 'Updated', value: m.updatedDate }
    ];
  }

  private resolveStatusToggleError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }
      if (error.status === 401) {
        return 'Session expired. Please sign in again.';
      }
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return 'Unable to update merchant status right now.';
  }

  private resolveApprovalError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }
      if (error.status === 401) {
        return 'Session expired. Please sign in again.';
      }
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return 'Unable to approve this merchant right now.';
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
      if (error.status === 404) {
        return 'Merchant not found.';
      }
      if (error.status === 401) {
        return 'Session expired. Please sign in again.';
      }
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return 'Unable to load this merchant right now.';
  }
}
