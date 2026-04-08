import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-invoice-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="dashboard-main merchant-main grid gap-5">
      <section class="grid gap-2 border-b border-[rgba(138,158,191,0.16)] pb-3">
        <p class="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">
          Create Invoice
        </p>
        <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.9rem)] font-bold leading-tight tracking-[-0.025em] text-[#2a3340]">
          Build and send a professional invoice
        </h1>
        <p class="m-0 max-w-3xl text-sm leading-6 text-[#61708a]">
          Prepare billing details for a customer and generate a clean invoice summary your team can use immediately.
        </p>
      </section>

      <section class="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_340px]">
        <article class="merchant-panel grid gap-5 rounded-[1.8rem]">
          <form class="grid gap-4 md:grid-cols-2" [formGroup]="invoiceForm" (ngSubmit)="submit()">
            <label class="grid gap-2 md:col-span-2">
              <span class="text-sm font-semibold text-[#42526b]">Client name</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="clientName" placeholder="Acme Limited" />
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Client email</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="clientEmail" placeholder="finance@acme.com" />
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Invoice amount</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="amount" placeholder="2500.00" />
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Due date</span>
              <input type="date" class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="dueDate" />
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Reference</span>
              <input class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none" formControlName="reference" placeholder="INV-101-0426" />
            </label>

            <label class="grid gap-2 md:col-span-2">
              <span class="text-sm font-semibold text-[#42526b]">Description</span>
              <textarea rows="5" class="rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 py-3 outline-none" formControlName="description" placeholder="Product delivery, consulting, retainers, or milestone billing" ></textarea>
            </label>

            <div *ngIf="showError()" class="rounded-2xl border border-[#ffd4d0] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#b42318] md:col-span-2">
              Fill in the required invoice fields before continuing.
            </div>

            <div class="md:col-span-2 flex justify-end">
              <button type="submit" class="primary-btn min-w-[180px]">Create Invoice</button>
            </div>
          </form>
        </article>

        <aside class="merchant-panel grid gap-4 rounded-[1.8rem]">
          <div>
            <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">Preview</p>
            <h2 class="mt-2 mb-0 text-xl font-bold text-[#2f3743]">Invoice summary</h2>
          </div>

          <div class="grid gap-3 rounded-[1.4rem] bg-[#f8fbff] p-4">
            <div>
              <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Client</p>
              <strong class="mt-1 block text-base text-[#2f3743]">{{ preview().clientName }}</strong>
              <span class="text-sm text-[#607089]">{{ preview().clientEmail }}</span>
            </div>
            <div>
              <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Amount</p>
              <strong class="mt-1 block text-base text-[#2f3743]">{{ preview().amount }}</strong>
            </div>
            <div>
              <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Timeline</p>
              <span class="mt-1 block text-sm text-[#607089]">Due {{ preview().dueDate }}</span>
              <span class="text-sm text-[#607089]">Ref {{ preview().reference }}</span>
            </div>
            <div>
              <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Notes</p>
              <span class="mt-1 block text-sm leading-6 text-[#607089]">{{ preview().description }}</span>
            </div>
          </div>

          <div *ngIf="successMessage()" class="rounded-2xl border border-[#d9f0dd] bg-[#edf9ef] px-4 py-3 text-sm font-medium text-[#1c7f3d]">
            {{ successMessage() }}
          </div>
        </aside>
      </section>
    </main>
  `
})
export class CreateInvoicePageComponent {
  private readonly fb = inject(FormBuilder);

  protected readonly successMessage = signal('');
  protected readonly invoiceForm = this.fb.nonNullable.group({
    clientName: ['', Validators.required],
    clientEmail: ['', [Validators.required, Validators.email]],
    amount: ['', Validators.required],
    dueDate: ['', Validators.required],
    reference: ['INV-101-0426', Validators.required],
    description: ['Invoice for merchant services and deliverables.', Validators.required]
  });
  protected readonly showError = computed(
    () => this.invoiceForm.invalid && (this.invoiceForm.touched || this.invoiceForm.dirty)
  );
  protected readonly preview = computed(() => {
    const value = this.invoiceForm.getRawValue();
    return {
      clientName: value.clientName || 'Client name',
      clientEmail: value.clientEmail || 'client@email.com',
      amount: value.amount ? `$${value.amount}` : '$0.00',
      dueDate: value.dueDate || 'not set',
      reference: value.reference || 'INV-REF',
      description: value.description || 'Invoice notes appear here.'
    };
  });

  protected submit(): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    const value = this.invoiceForm.getRawValue();
    this.successMessage.set(`Invoice ${value.reference} prepared for ${value.clientName}.`);
  }
}
