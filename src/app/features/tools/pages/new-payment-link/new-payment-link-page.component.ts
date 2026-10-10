import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { AppModeService } from '../../../../core/services/app-mode.service';
import { CreatedPaymentLink } from '../../../payment-link/data/payment-link.models';
import { PaymentLinkService } from '../../../payment-link/data/payment-link.service';

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

      <section class="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_360px]">
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
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">First name</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="firstName" placeholder="John" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Last name</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="lastName" placeholder="Doe" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Email</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="email" placeholder="john@example.com" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Phone number</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="phoneNumber" placeholder="+2348012345678" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Country code</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="countryCode" placeholder="NG" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">City</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="city" placeholder="Lagos" />
            </label>
            <label class="grid gap-2 md:col-span-2">
              <span class="text-sm font-semibold text-[#42526b]">Address</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="address" placeholder="12 Marina Street" />
            </label>
            <label class="grid gap-2 md:col-span-2">
              <span class="text-sm font-semibold text-[#42526b]">Description</span>
              <textarea rows="4" class="rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 py-3 outline-none" formControlName="description" placeholder="What the buyer is paying for"></textarea>
            </label>

            <div *ngIf="showError() || errorMessage()" class="rounded-2xl border border-[#ffd4d0] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#b42318] md:col-span-2">
              {{ errorMessage() || 'Add the required payment link details before generating it.' }}
            </div>

            <div class="md:col-span-2 flex justify-end">
              <button type="submit" class="primary-btn min-w-[180px]" [disabled]="submitting()">{{ submitting() ? 'Generating…' : 'Generate Link' }}</button>
            </div>
          </form>
        </article>

        <aside class="merchant-panel grid content-start gap-4 self-start rounded-[1.8rem]">
          <ng-container *ngIf="createdLink() as link; else previewTpl">
            <div class="flex items-center gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-full bg-[#edf9ef] text-[#1c7f3d]" aria-hidden="true">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10" /></svg>
              </span>
              <div>
                <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">Link created</p>
                <h2 class="m-0 text-xl font-bold text-[#2f3743]">Ready to share</h2>
              </div>
            </div>
            <div class="grid gap-2 rounded-[1.4rem] bg-[#0f172a] p-4 text-white">
              <p class="m-0 text-xs uppercase tracking-[0.18em] text-white/60">Checkout URL</p>
              <p class="m-0 break-all text-sm leading-6">{{ link.checkoutUrl }}</p>
            </div>
            <div class="flex gap-2">
              <button type="button" class="primary-btn flex-1" (click)="copyLink(link.checkoutUrl)">
                {{ copied() ? 'Copied!' : 'Copy link' }}
              </button>
              <a
                [href]="link.checkoutUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex flex-1 items-center justify-center rounded-full border border-[rgba(138,158,191,0.3)] bg-white px-4 text-sm font-semibold text-[#42526b] transition hover:bg-[#f5f7fb]"
              >
                Open
              </a>
            </div>
            <dl class="m-0 grid gap-3 rounded-[1.4rem] bg-[#f8fbff] p-4 text-sm">
              <div class="flex justify-between gap-3"><dt class="text-[#607089]">Reference</dt><dd class="m-0 font-semibold text-[#2f3743]">{{ link.reference }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-[#607089]">Amount</dt><dd class="m-0 font-semibold text-[#2f3743]">{{ link.amount }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-[#607089]">Mode</dt><dd class="m-0 font-semibold text-[#2f3743]">{{ link.env === '1' || link.env === 'live' ? 'Live' : 'Test' }}</dd></div>
            </dl>
            <button type="button" class="text-sm font-semibold text-[#16a34a] hover:underline" (click)="createdLink.set(null)">
              Create another link
            </button>
          </ng-container>

          <ng-template #previewTpl>
            <div>
              <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">Preview</p>
              <h2 class="mt-2 mb-0 text-xl font-bold text-[#2f3743]">{{ preview().title }}</h2>
            </div>
            <div class="grid gap-1 rounded-[1.4rem] bg-[#f8fbff] p-4 text-sm text-[#607089]">
              <strong class="text-2xl text-[#2f3743]">{{ preview().amount }}</strong>
              <span>{{ preview().customer }}</span>
              <span class="mt-2">{{ preview().description }}</span>
            </div>
            <p class="m-0 text-sm text-[#8fa0b8]">The checkout URL will appear here once the link is generated.</p>
          </ng-template>
        </aside>
      </section>
    </main>
  `
})
export class NewPaymentLinkPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly paymentLinkService = inject(PaymentLinkService);
  private readonly appMode = inject(AppModeService);

  protected readonly createdLink = signal<CreatedPaymentLink | null>(null);
  protected readonly copied = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly paymentLinkForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    amount: ['', Validators.required],
    currency: ['USD', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    countryCode: ['', Validators.required],
    city: ['', Validators.required],
    address: ['', Validators.required],
    description: ['Quick checkout for premium services.', Validators.required]
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
      customer: [value.firstName, value.lastName].filter(Boolean).join(' ') || 'Customer name'
    };
  });

  protected submit(): void {
    if (this.paymentLinkForm.invalid) {
      this.paymentLinkForm.markAllAsTouched();
      return;
    }

    const { title, description, ...rest } = this.paymentLinkForm.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set('');
    this.createdLink.set(null);

    this.paymentLinkService
      .createPaymentLink({
        ...rest,
        redirectUrl: environment.paymentLinkRedirectUrl,
        reference: `PL-${Date.now()}`,
        env: String(this.appMode.mode())
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.createdLink.set(res.data);
          this.paymentLinkForm.reset();
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err?.error?.description ?? 'Could not create the payment link.');
        }
      });
  }

  protected copyLink(url: string): void {
    navigator.clipboard?.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
