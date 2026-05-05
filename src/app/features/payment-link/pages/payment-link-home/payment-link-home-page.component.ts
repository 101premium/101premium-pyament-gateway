import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-payment-link-home-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="dashboard-main merchant-main grid gap-5">
      <section class="grid gap-2 border-b border-[rgba(138,158,191,0.16)] pb-3">
        <p class="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">
          Payment Link
        </p>
        <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.9rem)] font-bold leading-tight tracking-[-0.025em] text-[#2a3340]">
          Payment links
        </h1>
      </section>

      <section class="merchant-panel grid min-h-[22rem] place-items-center rounded-[1.8rem] p-8 text-center">
        <div class="grid max-w-[30rem] gap-4">
          <div class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#eef0ff] text-[#2e39d3]" aria-hidden="true">
            <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.5 13.5 13.5 10.5" />
              <path d="M8.25 15.75 6.9 17.1a3.75 3.75 0 0 1-5.3-5.3l2.65-2.65a3.75 3.75 0 0 1 5.3 0" />
              <path d="m15.75 8.25 1.35-1.35a3.75 3.75 0 0 1 5.3 5.3l-2.65 2.65a3.75 3.75 0 0 1-5.3 0" />
            </svg>
          </div>
          <div class="grid gap-2">
            <p class="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[#8fa0b8]">Coming soon</p>
            <h2 class="m-0 text-2xl font-bold tracking-[-0.02em] text-[#2f3743]">
              Payment Link is on the way
            </h2>
            <p class="m-0 text-sm leading-6 text-[#61708a]">
              This module is being prepared and will be available here soon.
            </p>
          </div>
        </div>
      </section>
    </main>
  `
})
export class PaymentLinkHomePageComponent {}
