import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-customer-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="dashboard-main merchant-main grid gap-5">
      <section class="grid gap-2 border-b border-[rgba(138,158,191,0.16)] pb-3">
        <p class="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Add Customer</p>
        <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.9rem)] font-bold leading-tight tracking-[-0.025em] text-[#2a3340]">
          Capture a customer profile for future billing
        </h1>
      </section>

      <section class="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_360px]">
        <article class="merchant-panel grid gap-5 rounded-[1.8rem]">
          <form class="grid gap-4 md:grid-cols-2" [formGroup]="customerForm" (ngSubmit)="submit()">
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">First name</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="firstName" placeholder="Jane" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Last name</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="lastName" placeholder="Doe" />
            </label>
            <label class="grid gap-2 md:col-span-2">
              <span class="text-sm font-semibold text-[#42526b]">Email address</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="email" placeholder="jane.doe@example.com" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Phone number</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="phone" placeholder="+1 555 0100" />
            </label>
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Category</span>
              <select class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="category">
                <option value="Retail">Retail</option>
                <option value="Corporate">Corporate</option>
                <option value="Subscription">Subscription</option>
              </select>
            </label>
            <label class="grid gap-2 md:col-span-2">
              <span class="text-sm font-semibold text-[#42526b]">Address</span>
              <textarea rows="4" class="rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 py-3 outline-none" formControlName="address" placeholder="Office or billing address"></textarea>
            </label>

            <div *ngIf="showError()" class="rounded-2xl border border-[#ffd4d0] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#b42318] md:col-span-2">
              Complete the customer profile before saving it.
            </div>

            <div class="md:col-span-2 flex justify-end">
              <button type="submit" class="primary-btn min-w-[180px]">Save Customer</button>
            </div>
          </form>
        </article>

        <aside class="merchant-panel grid gap-4 rounded-[1.8rem]">
          <div>
            <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">Profile Preview</p>
            <h2 class="mt-2 mb-0 text-xl font-bold text-[#2f3743]">{{ preview().name }}</h2>
            <p class="mt-2 mb-0 text-sm text-[#607089]">{{ preview().category }}</p>
          </div>
          <div class="grid gap-3 rounded-[1.4rem] bg-[#f8fbff] p-4 text-sm text-[#607089]">
            <span>{{ preview().email }}</span>
            <span>{{ preview().phone }}</span>
            <span>{{ preview().address }}</span>
          </div>
          <div *ngIf="successMessage()" class="rounded-2xl border border-[#d9f0dd] bg-[#edf9ef] px-4 py-3 text-sm font-medium text-[#1c7f3d]">
            {{ successMessage() }}
          </div>
        </aside>
      </section>
    </main>
  `
})
export class AddCustomerPageComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly successMessage = signal('');
  protected readonly customerForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    category: ['Retail', Validators.required],
    address: ['', Validators.required]
  });
  protected readonly showError = computed(
    () => this.customerForm.invalid && (this.customerForm.touched || this.customerForm.dirty)
  );
  protected readonly preview = computed(() => {
    const value = this.customerForm.getRawValue();
    return {
      name: [value.firstName, value.lastName].filter(Boolean).join(' ') || 'Customer name',
      email: value.email || 'customer@email.com',
      phone: value.phone || '+0 000 0000',
      category: value.category || 'Retail',
      address: value.address || 'Customer address'
    };
  });

  protected submit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.successMessage.set(`Customer ${this.preview().name} added successfully.`);
  }
}
