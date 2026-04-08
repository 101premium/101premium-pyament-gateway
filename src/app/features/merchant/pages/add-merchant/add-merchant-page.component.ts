import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DigitOnlyModule } from '@uiowa/digit-only';
import { finalize } from 'rxjs';
import { MerchantService } from '../../data/merchant.service';

/** Nigeria country code + national significant number (digits only, no + or spaces). */
const COUNTRY_CODE_PHONE_PATTERN = /^234\d{7,14}$/;

@Component({
  selector: 'app-add-merchant-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DigitOnlyModule],
  template: `
    <main class="dashboard-main merchant-main grid gap-6">
      <section class="grid gap-2 border-b border-[rgba(138,158,191,0.16)] pb-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Merchants</p>
            <h1 class="mt-1.5 mb-0 text-[clamp(1.5rem,2.2vw,1.95rem)] font-bold leading-tight tracking-[-0.02em] text-[#1e293b]">
              Add merchant
            </h1>
          </div>
          <a
            routerLink="/merchants"
            class="rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-semibold text-[#475569] shadow-sm transition hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
          >
            Back to directory
          </a>
        </div>
      </section>

      <section
        class="grid gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(260px,1fr)] lg:gap-6"
      >
        <article
          class="rounded-2xl border border-[#e8ecf1] bg-white p-5 shadow-[0_4px_28px_rgba(15,23,42,0.06)] sm:p-6 lg:p-6"
        >
          <form class="grid gap-6" [formGroup]="merchantForm" (ngSubmit)="submit()">
            <fieldset class="m-0 grid gap-4 border-0 p-0 sm:gap-5 md:grid-cols-2">
              <legend class="md:col-span-2 mb-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                Business
              </legend>
              <label class="grid gap-1.5 md:col-span-2">
                <span class="text-sm font-semibold text-[#334155]">Business name</span>
                <input
                  class="add-merchant-input"
                  formControlName="businessName"
                  placeholder="Acme Stores Ltd"
                />
              </label>
              <label class="grid gap-1.5">
                <span class="text-sm font-semibold text-[#334155]">Business phone</span>
                <input
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  digitOnly
                  class="add-merchant-input"
                  formControlName="businessPhone"
                  placeholder="2348000000000"
                />
                <span
                  *ngIf="
                    merchantForm.controls.businessPhone.touched &&
                    merchantForm.controls.businessPhone.hasError('pattern')
                  "
                  class="text-xs font-medium text-[#d14343]"
                >
                  Use digits only, starting with country code 234 (e.g. 2348000000000).
                </span>
              </label>
              <label class="grid gap-1.5">
                <span class="text-sm font-semibold text-[#334155]">Business email</span>
                <input
                  type="email"
                  autocomplete="email"
                  class="add-merchant-input"
                  formControlName="businessEmail"
                  placeholder="billing@acme.example"
                />
                <span
                  *ngIf="
                    merchantForm.controls.businessEmail.touched &&
                    merchantForm.controls.businessEmail.hasError('required')
                  "
                  class="text-xs font-medium text-[#d14343]"
                >
                  Business email is required.
                </span>
                <span
                  *ngIf="
                    merchantForm.controls.businessEmail.touched &&
                    merchantForm.controls.businessEmail.hasError('email')
                  "
                  class="text-xs font-medium text-[#d14343]"
                >
                  Enter a valid email address (e.g. {{ 'billing@acme.example' }}).
                </span>
              </label>
              <label class="grid gap-1.5 md:col-span-2">
                <span class="text-sm font-semibold text-[#334155]">Business address</span>
                <textarea
                  rows="3"
                  class="add-merchant-input min-h-[5.5rem] resize-y py-3"
                  formControlName="businessAddress"
                  placeholder="Street, city, country"
                ></textarea>
              </label>
              <label class="grid gap-1.5">
                <span class="text-sm font-semibold text-[#334155]">CAC number</span>
                <input class="add-merchant-input" formControlName="cacNumber" placeholder="RC 123456" />
              </label>
              <label class="grid gap-1.5">
                <span class="text-sm font-semibold text-[#334155]">TIN</span>
                <input class="add-merchant-input" formControlName="tinNumber" placeholder="Tax ID" />
              </label>
            </fieldset>

            <fieldset
              class="m-0 grid gap-4 border-0 border-t border-[#eef2f7] pt-6 sm:gap-5 md:grid-cols-2 md:pt-7"
            >
              <legend class="md:col-span-2 mb-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                Primary contact
              </legend>
              <label class="grid gap-1.5">
                <span class="text-sm font-semibold text-[#334155]">First name</span>
                <input class="add-merchant-input" formControlName="firstName" placeholder="Jane" />
              </label>
              <label class="grid gap-1.5">
                <span class="text-sm font-semibold text-[#334155]">Last name</span>
                <input class="add-merchant-input" formControlName="lastName" placeholder="Doe" />
              </label>
              <label class="grid gap-1.5">
                <span class="text-sm font-semibold text-[#334155]">Email</span>
                <input
                  type="email"
                  autocomplete="email"
                  class="add-merchant-input"
                  formControlName="email"
                  placeholder="jane.doe@example.com"
                />
                <span
                  *ngIf="
                    merchantForm.controls.email.touched && merchantForm.controls.email.hasError('required')
                  "
                  class="text-xs font-medium text-[#d14343]"
                >
                  Email is required.
                </span>
                <span
                  *ngIf="
                    merchantForm.controls.email.touched && merchantForm.controls.email.hasError('email')
                  "
                  class="text-xs font-medium text-[#d14343]"
                >
                  Enter a valid email address.
                </span>
              </label>
              <label class="grid gap-1.5">
                <span class="text-sm font-semibold text-[#334155]">Phone</span>
                <input
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  digitOnly
                  class="add-merchant-input"
                  formControlName="phone"
                  placeholder="2348000000000"
                />
                <span
                  *ngIf="
                    merchantForm.controls.phone.touched && merchantForm.controls.phone.hasError('pattern')
                  "
                  class="text-xs font-medium text-[#d14343]"
                >
                  Use digits only, starting with country code 234 (e.g. 2348000000000).
                </span>
              </label>
            </fieldset>

            <div
              *ngIf="formError()"
              class="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]"
            >
              {{ formError() }}
            </div>

            <div
              *ngIf="successMessage()"
              class="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#15803d]"
            >
              {{ successMessage() }}
            </div>

            <div class="flex flex-wrap justify-end pt-1">
              <button type="submit" class="primary-btn min-w-[180px]" [disabled]="isSubmitting()">
                {{ isSubmitting() ? 'Creating…' : 'Create merchant' }}
              </button>
            </div>
          </form>
        </article>

        <aside
          class="h-fit rounded-2xl border border-[#e8ecf1] bg-white p-5 shadow-[0_4px_28px_rgba(15,23,42,0.06)] sm:p-6"
        >
          <p class="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">Preview</p>
          <h2 class="mt-3 mb-0 text-xl font-bold leading-snug text-[#1e293b] sm:text-2xl">
            {{ preview().businessName }}
          </h2>
          <p class="mt-1.5 mb-0 text-sm text-[#64748b]">{{ preview().contactName }}</p>

          <div
            class="mt-5 grid gap-0 divide-y divide-[#e2e8f0] rounded-xl bg-[#f1f5f9] px-4 py-1 text-sm text-[#475569]"
          >
            <div class="py-3 break-words">{{ preview().businessEmail }}</div>
            <div class="py-3">{{ preview().businessPhone }}</div>
            <div class="py-3 break-words leading-relaxed">{{ preview().businessAddress }}</div>
            <div class="py-3 text-[#64748b]">{{ preview().cacTin }}</div>
          </div>
        </aside>
      </section>
    </main>
  `,
  styles: [
    `
      .add-merchant-input {
        box-sizing: border-box;
        width: 100%;
        min-height: 2.75rem;
        border-radius: 0.75rem;
        border: 1px solid #e2e8f0;
        background: #fff;
        padding: 0 0.875rem;
        font-size: 0.875rem;
        line-height: 1.4;
        color: #1e293b;
        outline: none;
        transition:
          border-color 0.15s ease,
          box-shadow 0.15s ease;
      }
      .add-merchant-input::placeholder {
        color: #94a3b8;
      }
      .add-merchant-input:focus {
        border-color: #cbd5e1;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 22%, transparent);
      }
      .primary-btn:disabled {
        cursor: not-allowed;
        opacity: 0.55;
        transform: none;
      }
    `
  ]
})
export class AddMerchantPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly merchantService = inject(MerchantService);
  private readonly router = inject(Router);

  protected readonly formError = signal('');
  protected readonly successMessage = signal('');
  protected readonly isSubmitting = signal(false);

  protected readonly merchantForm = this.fb.nonNullable.group({
    businessName: ['', Validators.required],
    businessPhone: ['', [Validators.required, Validators.pattern(COUNTRY_CODE_PHONE_PATTERN)]],
    businessEmail: ['', [Validators.required, Validators.email]],
    businessAddress: ['', Validators.required],
    cacNumber: ['', Validators.required],
    tinNumber: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(COUNTRY_CODE_PHONE_PATTERN)]]
  });

  protected readonly preview = computed(() => {
    const v = this.merchantForm.getRawValue();
    const cac = v.cacNumber?.trim();
    const tin = v.tinNumber?.trim();
    const reg = [cac && `CAC ${cac}`, tin && `TIN ${tin}`].filter(Boolean).join(' · ');
    return {
      businessName: v.businessName?.trim() || 'Business name',
      contactName: [v.firstName, v.lastName].filter((s) => s?.trim()).join(' ') || 'Contact name',
      businessEmail: v.businessEmail?.trim() || 'business@email.com',
      businessPhone: v.businessPhone?.trim() || '—',
      businessAddress: v.businessAddress?.trim() || 'Address',
      cacTin: reg || 'CAC / TIN'
    };
  });

  protected submit(): void {
    this.formError.set('');
    this.successMessage.set('');

    if (this.merchantForm.invalid) {
      this.merchantForm.markAllAsTouched();
      this.formError.set('Complete every field before submitting.');
      return;
    }

    const v = this.merchantForm.getRawValue();
    this.isSubmitting.set(true);

    this.merchantService
      .createMerchant({
        businessName: v.businessName.trim(),
        businessPhone: v.businessPhone.trim(),
        businessEmail: v.businessEmail.trim(),
        businessAddress: v.businessAddress.trim(),
        cacNumber: v.cacNumber.trim(),
        tinNumber: v.tinNumber.trim(),
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        email: v.email.trim(),
        phone: v.phone.trim()
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: ({ uniqueId }) => {
          this.successMessage.set('Merchant created successfully.');
          if (uniqueId) {
            void this.router.navigate(['/merchants', uniqueId]);
          }
        },
        error: (error: unknown) => {
          this.formError.set(this.resolveSubmitErrorMessage(error));
        }
      });
  }

  private resolveSubmitErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return 'Unable to create merchant right now.';
  }
}
