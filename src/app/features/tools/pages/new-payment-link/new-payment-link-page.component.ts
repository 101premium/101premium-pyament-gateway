import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-new-payment-link-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="dashboard-main merchant-main grid gap-5">
      <section class="grid gap-2 border-b border-[rgba(138,158,191,0.16)] pb-3">
        <p class="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">New Payment Link</p>
        <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.9rem)] font-bold leading-tight tracking-[-0.025em] text-[#2a3340]">
          Create a shareable checkout link
        </h1>
      </section>

      <section class="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_360px]">
        <article class="merchant-panel grid gap-5 rounded-[1.8rem]">
          <form class="grid gap-4 md:grid-cols-2" [formGroup]="paymentLinkForm" (ngSubmit)="submit()">
            <label class="grid gap-2 md:col-span-2">
              <span class="text-sm font-semibold text-[#42526b]">Link title</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="title" placeholder="Premium package checkout" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Amount</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="amount" placeholder="99.00" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Currency</span>
              <select class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="currency">
                <option value="USD">USD</option>
                <option value="NGN">NGN</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            <label class="grid gap-2 md:col-span-2">
              <span class="text-sm font-semibold text-[#42526b]">Description</span>
              <textarea rows="4" class="rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 py-3 outline-none" formControlName="description" placeholder="What the buyer is paying for"></textarea>
            </label>
            <label class="grid gap-2 md:col-span-2">
              <span class="text-sm font-semibold text-[#42526b]">Redirect URL</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="redirectUrl" placeholder="https://yourapp.com/thank-you" />
            </label>

            <div *ngIf="showError()" class="rounded-2xl border border-[#ffd4d0] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#b42318] md:col-span-2">
              Add the required payment link details before generating it.
            </div>

            <div class="md:col-span-2 flex justify-end">
              <button type="submit" class="primary-btn min-w-[180px]">Generate Link</button>
            </div>
          </form>
        </article>

        <aside class="merchant-panel grid gap-4 rounded-[1.8rem]">
          <div>
            <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">Share Preview</p>
            <h2 class="mt-2 mb-0 text-xl font-bold text-[#2f3743]">{{ preview().title }}</h2>
          </div>
          <div class="rounded-[1.4rem] bg-[#0f172a] p-4 text-white">
            <p class="m-0 text-xs uppercase tracking-[0.18em] text-white/60">Checkout URL</p>
            <p class="mt-3 mb-0 break-all text-sm leading-6">{{ generatedLink() }}</p>
          </div>
          <div class="grid gap-2 rounded-[1.4rem] bg-[#f8fbff] p-4 text-sm text-[#607089]">
            <strong class="text-base text-[#2f3743]">{{ preview().amount }}</strong>
            <span>{{ preview().description }}</span>
            <span>{{ preview().redirectUrl }}</span>
          </div>
          <div *ngIf="successMessage()" class="rounded-2xl border border-[#d9f0dd] bg-[#edf9ef] px-4 py-3 text-sm font-medium text-[#1c7f3d]">
            {{ successMessage() }}
          </div>
        </aside>
      </section>
    </main>
  `
})
export class NewPaymentLinkPageComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly successMessage = signal('');
  protected readonly paymentLinkForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    amount: ['', Validators.required],
    currency: ['USD', Validators.required],
    description: ['Quick checkout for premium services.', Validators.required],
    redirectUrl: ['https://101premium.com/thank-you', Validators.required]
  });
  protected readonly showError = computed(
    () => this.paymentLinkForm.invalid && (this.paymentLinkForm.touched || this.paymentLinkForm.dirty)
  );
  protected readonly preview = computed(() => {
    const value = this.paymentLinkForm.getRawValue();
    return {
      title: value.title || 'Payment link title',
      amount: value.amount ? `${value.currency} ${value.amount}` : `${value.currency} 0.00`,
      description: value.description || 'Payment link description',
      redirectUrl: value.redirectUrl || 'https://example.com/redirect'
    };
  });
  protected readonly generatedLink = computed(() => {
    const value = this.paymentLinkForm.getRawValue();
    const slug = (value.title || 'payment-link')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `https://pay.101premium.com/link/${slug || 'payment-link'}`;
  });

  protected submit(): void {
    if (this.paymentLinkForm.invalid) {
      this.paymentLinkForm.markAllAsTouched();
      return;
    }

    this.successMessage.set('Payment link generated and ready to share.');
  }
}
