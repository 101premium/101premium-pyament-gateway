import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { distinctUntilChanged, finalize } from 'rxjs';
import {
  PaymentAsset,
  PaymentAssetNetwork,
  PaymentWallet
} from '../../../features/payment/data/payments.models';
import { PaymentsService } from '../../../features/payment/data/payments.service';
import { AppModalComponent } from '../app-modal/app-modal.component';

@Component({
  selector: 'app-stable-coin-wallet-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppModalComponent],
  template: `
    <app-modal
      [title]="'Generate stable coin wallet'"
      [eyebrow]="'Wallet'"
      [titleId]="'stable-coin-wallet-title'"
      (dismiss)="close()"
    >
      <form
        *ngIf="!walletResult()"
        id="stable-coin-wallet-form"
        class="grid gap-4 md:grid-cols-2"
        [formGroup]="walletForm"
        (ngSubmit)="submit()"
      >
        <label class="grid gap-1.5 md:col-span-2">
          <span class="text-sm font-semibold text-[#42526b]">Customer Email</span>
          <input
            type="email"
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-3 text-sm text-[#24324d] outline-none"
            formControlName="customEmail"
            placeholder="customer@email.com"
          />
        </label>

        <label class="grid gap-1.5">
          <span class="text-sm font-semibold text-[#42526b]">Coin</span>
          <select
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-3 text-sm text-[#24324d] outline-none"
            formControlName="coin"
          >
            <option value="">{{ assetLoading() ? 'Loading coins...' : 'Select coin' }}</option>
            @for (asset of coinOptions(); track asset.coin) {
              <option [value]="asset.coin">{{ asset.name }} ({{ asset.coin }})</option>
            }
          </select>
          <span *ngIf="assetError()" class="text-xs font-medium text-[#b42318]">{{ assetError() }}</span>
        </label>

        <label class="grid gap-1.5">
          <span class="text-sm font-semibold text-[#42526b]">Network</span>
          <select
            class="min-h-11 rounded-xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-3 text-sm text-[#24324d] outline-none"
            formControlName="network"
          >
            <option value="">{{ networkLoading() ? 'Loading networks...' : 'Select network' }}</option>
            @for (network of networkOptions(); track network.network) {
              <option [value]="network.network">{{ network.network }} ({{ network.name }})</option>
            }
          </select>
          <span *ngIf="networkError()" class="text-xs font-medium text-[#b42318]">{{ networkError() }}</span>
        </label>

        <div
          *ngIf="walletForm.invalid && walletForm.touched"
          class="rounded-xl border border-[#ffd4d0] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#b42318] md:col-span-2"
        >
          Complete the wallet fields before generating an address.
        </div>

        <div
          *ngIf="walletError()"
          class="rounded-xl border border-[#ffd4d0] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#b42318] md:col-span-2"
        >
          {{ walletError() }}
        </div>
      </form>

      <div *ngIf="walletResult()" class="grid gap-3 rounded-[1.2rem] bg-[#f8fbff] p-4 text-sm text-[#607089]">
        <div>
          <span class="block text-xs font-bold uppercase tracking-[0.14em] text-[#91a0bb]">Wallet Address</span>
          <strong class="mt-1 block break-all text-[#2f3743]">{{ walletResult()!.address }}</strong>
        </div>
        <div class="grid gap-2 md:grid-cols-2">
          <span>{{ walletResult()!.currency }} · {{ walletResult()!.network }}</span>
          <span>{{ walletResult()!.message }}</span>
        </div>
        <p class="m-0 text-xs font-medium text-[#b54708]">{{ walletResult()!.notice }}</p>
        <div class="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center rounded-xl border border-[rgba(138,158,191,0.24)] bg-white px-3 text-sm font-bold text-[#52627c] transition hover:bg-[#f5f7fb]"
            (click)="copyWalletAddress()"
          >
            Copy Address
          </button>
          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#2e39d3] bg-[#2e39d3] px-3 text-sm font-bold text-white transition hover:bg-[#2630b8]"
            (click)="copyWalletDetails()"
          >
            Copy All
          </button>
        </div>
        <p *ngIf="copyMessage()" class="m-0 text-xs font-bold text-[#1c7f3d]">{{ copyMessage() }}</p>
        <p *ngIf="copyError()" class="m-0 text-xs font-bold text-[#b42318]">{{ copyError() }}</p>
      </div>

      <ng-container modal-actions>
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[rgba(138,158,191,0.24)] bg-white px-4 text-sm font-bold text-[#52627c] transition hover:bg-[#f5f7fb]"
          [disabled]="walletSubmitting()"
          (click)="close()"
        >
          Close
        </button>
        <button
          *ngIf="!walletResult()"
          type="submit"
          form="stable-coin-wallet-form"
          class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#2e39d3] bg-[#2e39d3] px-4 text-sm font-bold text-white transition hover:bg-[#2630b8] disabled:cursor-not-allowed disabled:opacity-65"
          [disabled]="walletSubmitting()"
        >
          {{ walletSubmitting() ? 'Generating...' : 'Generate wallet' }}
        </button>
      </ng-container>
    </app-modal>
  `
})
export class StableCoinWalletModalComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly paymentsService = inject(PaymentsService);

  readonly dismiss = output<void>();
  readonly generated = output<PaymentWallet>();

  protected readonly walletForm = this.fb.nonNullable.group({
    customEmail: ['', [Validators.required, Validators.email]],
    coin: ['', Validators.required],
    network: ['', Validators.required]
  });
  protected readonly coinOptions = signal<PaymentAsset[]>([]);
  protected readonly networkOptions = signal<PaymentAssetNetwork[]>([]);
  protected readonly assetLoading = signal(false);
  protected readonly networkLoading = signal(false);
  protected readonly assetError = signal('');
  protected readonly networkError = signal('');
  protected readonly walletSubmitting = signal(false);
  protected readonly walletError = signal('');
  protected readonly walletResult = signal<PaymentWallet | null>(null);
  protected readonly copyMessage = signal('');
  protected readonly copyError = signal('');

  constructor() {
    this.loadPaymentAssets();

    this.walletForm.controls.coin.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((coin) => {
        this.walletForm.controls.network.setValue('');
        this.networkOptions.set([]);
        this.networkError.set('');

        const selectedCoin = coin.trim();
        if (selectedCoin) {
          this.loadPaymentAssetNetworks(selectedCoin);
        }
      });
  }

  protected close(): void {
    if (!this.walletSubmitting()) {
      this.dismiss.emit();
    }
  }

  protected submit(): void {
    if (this.walletSubmitting()) {
      return;
    }
    if (this.walletForm.invalid) {
      this.walletForm.markAllAsTouched();
      return;
    }

    this.walletSubmitting.set(true);
    this.walletError.set('');
    this.walletResult.set(null);
    this.copyMessage.set('');
    this.copyError.set('');

    this.paymentsService
      .createPaymentWallet({
        ref: createUuid(),
        ...this.walletForm.getRawValue()
      })
      .pipe(finalize(() => this.walletSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          const wallet = response.data ?? null;
          this.walletResult.set(wallet);
          if (wallet) {
            this.generated.emit(wallet);
          }
        },
        error: (error: unknown) => this.walletError.set(this.resolveApiError(error, 'Unable to generate wallet right now.'))
      });
  }

  protected copyWalletAddress(): void {
    const address = this.walletResult()?.address;
    if (!address) {
      return;
    }
    void this.copyToClipboard(address, 'Wallet address copied.');
  }

  protected copyWalletDetails(): void {
    const wallet = this.walletResult();
    if (!wallet) {
      return;
    }

    const details = [
      `Wallet Address: ${wallet.address}`,
      `Currency: ${wallet.currency}`,
      `Network: ${wallet.network}`,
      `Expiry: ${wallet.message}`,
      `Warning: ${wallet.notice}`
    ].join('\n');

    void this.copyToClipboard(details, 'Wallet details copied.');
  }

  private async copyToClipboard(value: string, successMessage: string): Promise<void> {
    this.copyMessage.set('');
    this.copyError.set('');

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard is not available in this browser.');
      }

      await navigator.clipboard.writeText(value);
      this.copyMessage.set(successMessage);
    } catch (error) {
      this.copyError.set(error instanceof Error ? error.message : 'Unable to copy right now.');
    }
  }

  private loadPaymentAssets(): void {
    this.assetLoading.set(true);
    this.assetError.set('');

    this.paymentsService
      .getPaymentAssets()
      .pipe(finalize(() => this.assetLoading.set(false)))
      .subscribe({
        next: (assets) => this.coinOptions.set(assets.filter((asset) => asset.coin?.trim())),
        error: (error: unknown) => this.assetError.set(this.resolveApiError(error, 'Unable to load coins right now.'))
      });
  }

  private loadPaymentAssetNetworks(coin: string): void {
    this.networkLoading.set(true);
    this.networkError.set('');

    this.paymentsService
      .getPaymentAssetNetworks(coin)
      .pipe(finalize(() => this.networkLoading.set(false)))
      .subscribe({
        next: (networks) => this.networkOptions.set(networks.filter((network) => network.network?.trim())),
        error: (error: unknown) =>
          this.networkError.set(this.resolveApiError(error, 'Unable to load networks right now.'))
      });
  }

  private resolveApiError(error: unknown, fallback: string): string {
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

function createUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
