import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../features/auth/data/auth.service';
import { MerchantSearchService } from '../services/merchant-search.service';
import { initialsFromName, titleCase } from '../utils/format.utils';
import { HelpAiPanelComponent } from '../components/help-ai-panel/help-ai-panel.component';

@Component({
  selector: 'app-merchant-layout',
  standalone: true,
  host: { class: 'block' },
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    HelpAiPanelComponent
  ],
  template: `
    <div class="dashboard-page" [class.sidebar-collapsed]="sidebarCollapsed()">
      @if (sidebarOpen()) {
        <button
          type="button"
          class="fixed inset-0 z-30 bg-[rgba(15,23,42,0.28)] backdrop-blur-[2px] min-[1101px]:hidden"
          aria-label="Close sidebar"
          (click)="closeSidebar()"
        ></button>
      }

      <aside class="merchant-sidebar" [class.is-open]="sidebarOpen()">
        <div class="mb-1 flex items-center justify-between gap-3 min-[1101px]:justify-center">
          <img
            class="mx-auto h-[80px] w-[80px] shrink-0 object-contain"
            src="/logo/101premiun_logo.png"
            alt="101Premium logo"
          />
          <button
            type="button"
            class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(138,158,191,0.22)] bg-white text-[#5e6f8f] shadow-[0_10px_24px_rgba(48,72,112,0.08)] max-[1100px]:inline-flex"
            aria-label="Collapse sidebar"
            (click)="closeSidebar()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div class="grid gap-[0.9rem]">
          <p class="m-0 text-[0.78rem] font-bold uppercase tracking-[0.24em] text-[#91a0bb]">Menu</p>
          <nav class="grid gap-[0.45rem]">
            @for (item of menuItems; track item.label) {
              @if (item.children?.length) {
                <div class="grid gap-1">
                  <a
                    class="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left no-underline transition duration-200 ease-out text-[#6b7c99] hover:bg-[#f3f4ff] hover:text-[#2e39d3]"
                    [routerLink]="item.link"
                    routerLinkActive="bg-[#eef0ff] text-[#2e39d3]"
                    [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                    (click)="closeSidebarOnMobile()"
                  >
                    <span class="grid h-5 w-5 shrink-0 place-items-center text-inherit" aria-hidden="true">
                      <ng-container [ngTemplateOutlet]="navIcon" [ngTemplateOutletContext]="{ icon: item.icon }" />
                    </span>
                    <span class="text-[1.05rem] font-medium leading-none">{{ item.label }}</span>
                  </a>

                  <div class="ml-8 grid gap-1 border-l border-[rgba(138,158,191,0.16)] pl-3">
                    @for (child of item.children; track child.label) {
                      <a
                        class="flex min-h-10 w-full items-center rounded-xl px-3 py-2 text-left text-[0.95rem] font-semibold text-[#7b8ba6] no-underline transition duration-200 ease-out hover:bg-[#f3f4ff] hover:text-[#2e39d3]"
                        [routerLink]="child.link"
                        routerLinkActive="bg-[#eef0ff] text-[#2e39d3]"
                        [routerLinkActiveOptions]="{ exact: child.exact ?? false }"
                        (click)="closeSidebarOnMobile()"
                      >
                        {{ child.label }}
                      </a>
                    }
                  </div>
                </div>
              } @else if (item.link) {
                <a
                  class="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left no-underline transition duration-200 ease-out text-[#6b7c99] hover:bg-[#f3f4ff] hover:text-[#2e39d3]"
                  [routerLink]="item.link"
                  routerLinkActive="bg-[#eef0ff] text-[#2e39d3]"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  (click)="closeSidebarOnMobile()"
                >
                  <span class="grid h-5 w-5 shrink-0 place-items-center text-inherit" aria-hidden="true">
                    <ng-container [ngTemplateOutlet]="navIcon" [ngTemplateOutletContext]="{ icon: item.icon }" />
                  </span>
                  <span class="text-[1.05rem] font-medium leading-none">{{ item.label }}</span>
                </a>
              } @else {
                <a
                  class="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left no-underline transition duration-200 ease-out text-[#6b7c99] hover:bg-[#f3f4ff] hover:text-[#2e39d3]"
                  href="#"
                  (click)="$event.preventDefault()"
                >
                  <span class="grid h-5 w-5 shrink-0 place-items-center text-inherit" aria-hidden="true">
                    <ng-container [ngTemplateOutlet]="navIcon" [ngTemplateOutletContext]="{ icon: item.icon }" />
                  </span>
                  <span class="text-[1.05rem] font-medium leading-none">{{ item.label }}</span>
                </a>
              }
            }
          </nav>
        </div>

        <div class="grid gap-[0.9rem]">
          <p class="m-0 text-[0.78rem] font-bold uppercase tracking-[0.24em] text-[#91a0bb]">Support</p>
          <nav class="grid gap-[0.45rem]">
            <a
              class="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left no-underline transition duration-200 ease-out text-[#6b7c99] hover:bg-[#f3f4ff] hover:text-[#2e39d3]"
              *ngFor="let item of supportItems"
              href="#"
              (click)="handleSupportItemClick($event, item.action)"
            >
              <span class="grid h-5 w-5 shrink-0 place-items-center text-inherit" aria-hidden="true">
                <ng-container [ngTemplateOutlet]="navIcon" [ngTemplateOutletContext]="{ icon: item.icon }" />
              </span>
              <span class="text-[1.05rem] font-medium leading-none">{{ item.label }}</span>
            </a>
          </nav>
        </div>
      </aside>

      <div class="merchant-main-column grid min-w-0 gap-5 content-start">
        <header
          class="flex flex-wrap items-center justify-between gap-x-4 gap-y-[0.85rem] rounded-[1.25rem] py-[0.65rem] pr-4 pl-[1.1rem] max-[720px]:grid max-[720px]:grid-cols-[auto_1fr] max-[720px]:items-center max-[720px]:gap-x-3 max-[720px]:gap-y-3 max-[720px]:px-0 max-[720px]:py-0"
        >
          <button
            type="button"
            class="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-2xl border border-[rgba(138,158,191,0.24)] bg-white px-3 text-[0.95rem] font-semibold text-[#24324d] shadow-[0_12px_30px_rgba(48,72,112,0.12)] max-[720px]:row-start-1"
            [attr.aria-label]="sidebarCollapsed() || !sidebarOpen() ? 'Open sidebar' : 'Collapse sidebar'"
            (click)="toggleSidebar()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-5 w-5"
              aria-hidden="true"
            >
              <rect x="3.75" y="4.5" width="16.5" height="15" rx="2.25" />
              <path d="M9 4.5v15" />
              <path d="m14.25 9 2.25 3-2.25 3" />
            </svg>
            <span>{{ sidebarCollapsed() || !sidebarOpen() ? 'Panel' : 'Close' }}</span>
          </button>

          <label
            class="m-0 flex min-w-0 max-w-[640px] flex-[1_1_12rem] items-center gap-3 rounded-full border border-[rgba(138,158,191,0.18)] bg-[rgba(255,255,255,0.95)] px-[1.1rem] py-[0.9rem] text-[#99a6bf] max-[720px]:col-span-2 max-[720px]:row-start-2 max-[720px]:max-w-none max-[720px]:px-4 max-[720px]:py-3"
            aria-label="Search transactions and customers"
          >
            <svg
              class="h-[1.125rem] w-[1.125rem] shrink-0 text-[#98a5bd]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m21 21-4.35-4.35" />
              <circle cx="11" cy="11" r="6.75" />
            </svg>
            <input
              type="search"
              class="w-full border-0 bg-transparent text-[#344054] outline-0 placeholder:text-[#9aa6bf]"
              placeholder="Search transactions, customers..."
              [formControl]="merchantSearch.control"
              autocomplete="off"
            />
          </label>

          <div
            class="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-[0.35rem] max-[720px]:row-start-1 max-[720px]:min-w-0 max-[720px]:justify-end"
          >
            <button
              type="button"
              class="inline-flex h-[2.7rem] w-[2.7rem] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[1.1rem] text-[#5e6f8f] hover:not-disabled:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] hover:not-disabled:text-[var(--primary)] [&_svg]:size-[1.35rem]"
              aria-label="Notifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.08 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </button>
            <button
              type="button"
              class="inline-flex h-[2.7rem] w-[2.7rem] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[1.1rem] text-[#5e6f8f] hover:not-disabled:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] hover:not-disabled:text-[var(--primary)] [&_svg]:size-[1.35rem]"
              aria-label="Help Center — Ask AI"
              (click)="openHelp()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M12 18h.008v.008H12V18Z" />
                <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3" />
                <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
              </svg>
            </button>

            <div
              class="ml-[0.15rem] flex items-center gap-[0.8rem] border-l border-[rgba(138,158,191,0.24)] pl-4 max-[720px]:min-w-0 max-[720px]:flex-1 max-[720px]:justify-end max-[720px]:gap-3 max-[720px]:border-l-0 max-[720px]:pl-0 max-[720px]:text-right"
            >
              <div class="min-w-0 max-[720px]:text-right">
                <strong class="text-[0.95rem] font-bold tracking-[-0.02em] text-[#1d2a44]">{{
                  userDisplayName()
                }}</strong>
                <span class="mt-[0.1rem] block text-[0.875rem] text-[#7e8eaa]">{{ userRoleLabel() }}</span>
              </div>
              <div
                class="grid h-12 w-12 place-items-center rounded-full border-2 border-white/90 bg-[linear-gradient(135deg,#ffe0b2_0%,#8ed0ff_100%)] text-[0.82rem] font-bold text-[#1d2a44] shadow-[0_2px_8px_rgba(48,72,112,0.12)]"
                aria-hidden="true"
              >
                {{ userInitials() }}
              </div>
            </div>
          </div>
        </header>

        <router-outlet />
      </div>
    </div>

    @if (helpPanelOpen()) {
      <app-help-ai-panel (dismiss)="closeHelp()" />
    }

    <ng-template #navIcon let-icon="icon">
      @switch (icon) {
        @case ('home') {
          <svg class="nav-icon__svg size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2.25 12 8.954-8.955a1.125 1.125 0 0 1 1.591 0L21.75 12" />
            <path d="M4.5 9.75V19.5A1.5 1.5 0 0 0 6 21h3.75v-5.25A1.5 1.5 0 0 1 11.25 14.25h1.5a1.5 1.5 0 0 1 1.5 1.5V21H18a1.5 1.5 0 0 0 1.5-1.5V9.75" />
          </svg>
        }
        @case ('credit-card') {
          <svg class="nav-icon__svg size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2.25" y="4.5" width="19.5" height="15" rx="2.25" />
            <path d="M2.25 9.75h19.5" />
            <path d="M6.75 15.75h3" />
          </svg>
        }
        @case ('banknotes') {
          <svg class="nav-icon__svg size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15A2.25 2.25 0 0 1 21.75 6.75v10.5A2.25 2.25 0 0 1 19.5 19.5h-15a2.25 2.25 0 0 1-2.25-2.25V6.75Z" />
            <path d="M6 12h.008v.008H6V12Zm12 0h.008v.008H18V12Z" />
            <circle cx="12" cy="12" r="2.25" />
          </svg>
        }
        @case ('link') {
          <svg class="nav-icon__svg size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.5 13.5 13.5 10.5" />
            <path d="M8.25 15.75 6.9 17.1a3.75 3.75 0 0 1-5.3-5.3l2.65-2.65a3.75 3.75 0 0 1 5.3 0" />
            <path d="m15.75 8.25 1.35-1.35a3.75 3.75 0 0 1 5.3 5.3l-2.65 2.65a3.75 3.75 0 0 1-5.3 0" />
          </svg>
        }
        @case ('clipboard-document-list') {
          <svg class="nav-icon__svg size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 2.25h6a1.5 1.5 0 0 1 1.5 1.5V4.5h1.125A2.625 2.625 0 0 1 20.25 7.125v12.75A2.625 2.625 0 0 1 17.625 22.5H6.375A2.625 2.625 0 0 1 3.75 19.875V7.125A2.625 2.625 0 0 1 6.375 4.5H7.5v-.75A1.5 1.5 0 0 1 9 2.25Z" />
            <path d="M9 7.5h6" />
            <path d="M8.25 12h7.5" />
            <path d="M8.25 16.5h4.5" />
          </svg>
        }
        @case ('building-storefront') {
          <svg class="nav-icon__svg size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3.75 21h16.5v-9.75L12 3.75 3.75 11.25V21Z" />
            <path d="M9.75 21V12h4.5v9" />
            <path d="M3.75 10.5 12 4.5l8.25 6" />
          </svg>
        }
        @case ('users') {
          <svg class="nav-icon__svg size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 18.72A8.96 8.96 0 0 0 12 16.5a8.96 8.96 0 0 0-6 2.22" />
            <circle cx="12" cy="8.25" r="3.75" />
            <path d="M18.75 8.25a2.25 2.25 0 1 1 0 4.5" />
            <path d="M5.25 8.25a2.25 2.25 0 1 0 0 4.5" />
          </svg>
        }
        @case ('cog') {
          <svg class="nav-icon__svg size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4.5 12a7.5 7.5 0 0 1 .12-1.34l-1.7-1.32 1.5-2.6 2.02.53a7.56 7.56 0 0 1 2.32-1.35L9 3.75h3l.26 2.17a7.56 7.56 0 0 1 2.32 1.35l2.02-.53 1.5 2.6-1.7 1.32a7.5 7.5 0 0 1 0 2.68l1.7 1.32-1.5 2.6-2.02-.53a7.56 7.56 0 0 1-2.32 1.35L12 20.25H9l-.26-2.17a7.56 7.56 0 0 1-2.32-1.35l-2.02.53-1.5-2.6 1.7-1.32A7.5 7.5 0 0 1 4.5 12Z" />
            <circle cx="10.5" cy="12" r="1.5" />
          </svg>
        }
        @case ('question-mark-circle') {
          <svg class="nav-icon__svg size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 18h.008v.008H12V18Z" />
            <path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3" />
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
          </svg>
        }
        @case ('arrow-right-on-rectangle') {
          <svg class="nav-icon__svg size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15.75 9V5.625A2.625 2.625 0 0 0 13.125 3h-6.75A2.625 2.625 0 0 0 3.75 5.625v12.75A2.625 2.625 0 0 0 6.375 21h6.75a2.625 2.625 0 0 0 2.625-2.625V15" />
            <path d="M18 12H9.75" />
            <path d="m15.75 9 3 3-3 3" />
          </svg>
        }
      }
    </ng-template>
  `
})
export class MerchantLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly merchantSearch = inject(MerchantSearchService);

  protected readonly helpPanelOpen = signal(false);
  protected readonly sidebarOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);

  @HostListener('window:resize')
  protected handleWindowResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth >= 1101) {
      this.sidebarOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected handleEscapeKey(): void {
    this.closeSidebar();
  }

  protected openHelp(): void {
    this.helpPanelOpen.set(true);
  }

  protected closeHelp(): void {
    this.helpPanelOpen.set(false);
  }

  protected toggleSidebar(): void {
    if (typeof window !== 'undefined' && window.innerWidth >= 1101) {
      this.sidebarCollapsed.update((collapsed) => !collapsed);
      return;
    }

    this.sidebarOpen.update((open) => !open);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected closeSidebarOnMobile(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 1100) {
      this.closeSidebar();
    }
  }

  protected readonly menuItems: {
    label: string;
    icon: string;
    link?: string;
    exact?: boolean;
    children?: {
      label: string;
      link: string;
      exact?: boolean;
    }[];
  }[] = [
      { label: 'Overview', icon: 'home', link: '/dashboard', exact: true },
      {
        label: 'Payments',
        icon: 'credit-card',
        link: '/transactions',
        children: [{ label: 'Transactions', link: '/transactions', exact: true }]
      },
      { label: 'Payment Link', icon: 'link', link: '/payment-link' },
      { label: 'Payout', icon: 'banknotes', link: '/payout' },
      { label: 'Balance', icon: 'banknotes', link: '/balance' },
      { label: 'Teams', icon: 'users', link: '/teams' },
      { label: 'Audit Trail', icon: 'clipboard-document-list', link: '/audit' },
      { label: 'Merchants', icon: 'building-storefront', link: '/merchants' },
      { label: 'Settings', icon: 'cog', link: '/settings' }
    ];

  protected readonly supportItems = [
    { label: 'Help Center', icon: 'question-mark-circle', action: 'help' },
    { label: 'Logout', icon: 'arrow-right-on-rectangle', action: 'logout' }
  ];

  protected handleSupportItemClick(event: Event, action: string): void {
    event.preventDefault();
    this.closeSidebarOnMobile();

    if (action === 'help') {
      this.openHelp();
      return;
    }

    if (action !== 'logout') {
      return;
    }

    this.authService.logout();
    this.merchantSearch.reset();
    void this.router.navigate(['/auth/login']);
  }

  protected userDisplayName(): string {
    const session = this.authService.getSession();
    if (!session) {
      return 'Merchant';
    }
    const full = [session.firstName, session.lastName]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean)
      .join(' ')
      .trim();
    return full || session.email?.trim() || 'Merchant';
  }

  protected userRoleLabel(): string {
    const session = this.authService.getSession();
    const raw = session?.role?.trim();
    if (!raw) {
      return 'Admin';
    }
    return titleCase(raw.replace(/_/g, ' '));
  }

  protected userInitials(): string {
    return initialsFromName(this.userDisplayName());
  }
}
