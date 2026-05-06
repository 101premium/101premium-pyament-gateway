import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/data/auth.service';
import { AuthSession } from '../../../auth/data/auth.models';
import { MerchantSearchService } from '../../../../shared/services/merchant-search.service';
import { titleCase } from '../../../../shared/utils/format.utils';
import { SettingsService } from '../../data/settings.service';
import { PageFooterComponent } from '../../../../shared/components/page-footer/page-footer.component';

@Component({
  selector: 'app-settings-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageFooterComponent],
  template: `
    <main class="dashboard-main merchant-main grid max-w-[960px] gap-x-5 gap-y-5">
      <div *ngIf="passwordJustUpdated()" class="settings-pwd-toast" role="status">
        Your password was updated successfully.
      </div>

      <header
        class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5"
      >
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">
            Account
          </p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Settings
          </h1>
        </div>
      </header>

      <article class="merchant-panel merchant-panel--settings">
        <div class="panel-heading settings-panel-heading">
          <div>
            <h3>Profile</h3>
            <p>Information from your signed-in account.</p>
          </div>
        </div>
        <dl class="settings-dl">
          <div class="settings-dl__row">
            <dt>Name</dt>
            <dd>{{ displayName(session) }}</dd>
          </div>
          <div class="settings-dl__row">
            <dt>Email</dt>
            <dd>{{ session?.email || '—' }}</dd>
          </div>
          <div class="settings-dl__row">
            <dt>Phone</dt>
            <dd>{{ session?.phone || '—' }}</dd>
          </div>
          <div class="settings-dl__row">
            <dt>Role</dt>
            <dd>{{ roleLabel(session) }}</dd>
          </div>
          <div class="settings-dl__row">
            <dt>User ID</dt>
            <dd>{{ session?.userId ?? '—' }}</dd>
          </div>
          <div class="settings-dl__row">
            <dt>Last sign-in</dt>
            <dd>{{ session?.lastLogin || '—' }}</dd>
          </div>
        </dl>
      </article>

      <article class="merchant-panel merchant-panel--settings">
        <div class="panel-heading settings-panel-heading">
          <div>
            <h3>Notifications</h3>
            <p>Choose what we email you about. Preferences are saved on this device.</p>
          </div>
        </div>
        <ul class="settings-toggle-list">
          <li>
            <div class="settings-toggle-list__copy">
              <strong>Product updates</strong>
              <span>News and tips about 101Premium.</span>
            </div>
            <button
              type="button"
              class="settings-switch"
              role="switch"
              [attr.aria-checked]="settings.emailNotifications()"
              (click)="settings.setEmailNotifications(!settings.emailNotifications())"
            >
              <span class="settings-switch__thumb" [class.settings-switch__thumb--on]="settings.emailNotifications()"></span>
            </button>
          </li>
          <li>
            <div class="settings-toggle-list__copy">
              <strong>Payment alerts</strong>
              <span>When payments succeed, fail, or need attention.</span>
            </div>
            <button
              type="button"
              class="settings-switch"
              role="switch"
              [attr.aria-checked]="settings.paymentAlerts()"
              (click)="settings.setPaymentAlerts(!settings.paymentAlerts())"
            >
              <span class="settings-switch__thumb" [class.settings-switch__thumb--on]="settings.paymentAlerts()"></span>
            </button>
          </li>
          <li>
            <div class="settings-toggle-list__copy">
              <strong>Settlement alerts</strong>
              <span>Payout and settlement summaries.</span>
            </div>
            <button
              type="button"
              class="settings-switch"
              role="switch"
              [attr.aria-checked]="settings.settlementAlerts()"
              (click)="settings.setSettlementAlerts(!settings.settlementAlerts())"
            >
              <span class="settings-switch__thumb" [class.settings-switch__thumb--on]="settings.settlementAlerts()"></span>
            </button>
          </li>
        </ul>
      </article>

      <article class="merchant-panel merchant-panel--settings">
        <div class="panel-heading settings-panel-heading">
          <div>
            <h3>Security</h3>
            <p>Session and password options.</p>
          </div>
        </div>
        <div class="settings-security">
          <a routerLink="/settings/change-password" class="settings-change-pwd-link">Change password</a>
          <p class="settings-security__hint">
            If you are signed out, use <strong>Forgot password</strong> on the login screen to reset access.
          </p>
          <button type="button" class="settings-signout-btn" (click)="signOut()">Sign out</button>
        </div>
      </article>

      <app-page-footer />
    </main>
  `,
  styles: `
    .merchant-panel--settings .panel-heading h3 {
      margin: 0;
      color: #2f3743;
      font-size: 1.15rem;
    }

    .settings-panel-heading p {
      margin: 0.25rem 0 0;
      color: #7f8ea7;
      font-size: 0.9rem;
    }

    .settings-dl {
      margin: 1.25rem 0 0;
      display: grid;
      gap: 0;
    }

    .settings-dl__row {
      display: grid;
      grid-template-columns: minmax(0, 9rem) minmax(0, 1fr);
      gap: 1rem 1.5rem;
      padding: 0.85rem 0;
      border-top: 1px solid rgba(138, 158, 191, 0.14);
      align-items: baseline;
    }

    .settings-dl__row:first-of-type {
      border-top: 0;
      padding-top: 0;
    }

    .settings-dl dt {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #7a8aa3;
    }

    .settings-dl dd {
      margin: 0;
      font-size: 0.95rem;
      color: #2a3340;
      word-break: break-word;
    }

    .settings-toggle-list {
      list-style: none;
      margin: 1.25rem 0 0;
      padding: 0;
      display: grid;
      gap: 0;
    }

    .settings-toggle-list li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.1rem 0;
      border-top: 1px solid rgba(138, 158, 191, 0.14);
    }

    .settings-toggle-list li:first-child {
      border-top: 0;
      padding-top: 0;
    }

    .settings-toggle-list__copy {
      display: grid;
      gap: 0.2rem;
      min-width: 0;
    }

    .settings-toggle-list__copy strong {
      font-size: 0.98rem;
      color: #2a3340;
    }

    .settings-toggle-list__copy span {
      font-size: 0.88rem;
      color: #7a8aa3;
    }

    .settings-switch {
      position: relative;
      width: 3.1rem;
      height: 1.75rem;
      flex-shrink: 0;
      border-radius: 999px;
      border: 0;
      padding: 0;
      cursor: pointer;
      background: color-mix(in srgb, var(--secondary) 45%, var(--background));
      transition: background 0.15s ease;
    }

    .settings-switch[aria-checked='true'] {
      background: var(--primary);
    }

    .settings-switch:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    .settings-switch__thumb {
      position: absolute;
      top: 0.2rem;
      left: 0.2rem;
      width: 1.35rem;
      height: 1.35rem;
      border-radius: 999px;
      background: #fff;
      box-shadow: 0 2px 6px rgba(48, 72, 112, 0.18);
      transition: transform 0.15s ease;
    }

    .settings-switch__thumb--on {
      transform: translateX(1.35rem);
    }

    .settings-security {
      margin-top: 1.25rem;
      display: grid;
      gap: 1rem;
    }

    .settings-change-pwd-link {
      justify-self: start;
      display: inline-flex;
      align-items: center;
      min-height: 2.75rem;
      padding: 0 1.35rem;
      border-radius: 999px;
      border: 0;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: #fff;
      font-size: 0.92rem;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 10px 22px color-mix(in srgb, var(--primary) 22%, transparent);
    }

    .settings-change-pwd-link:hover {
      opacity: 0.95;
    }

    .settings-pwd-toast {
      margin: 0;
      padding: 0.85rem 1rem;
      border-radius: 0.85rem;
      border: 1px solid rgba(28, 127, 61, 0.28);
      background: rgba(237, 249, 239, 0.95);
      color: #1c7f3d;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .settings-security__hint {
      margin: 0;
      font-size: 0.92rem;
      line-height: 1.5;
      color: #5d6d88;
    }

    .settings-signout-btn {
      justify-self: start;
      min-height: 2.75rem;
      padding: 0 1.35rem;
      border-radius: 999px;
      border: 1px solid rgba(180, 35, 24, 0.35);
      background: rgba(255, 255, 255, 0.9);
      color: #b42318;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
    }

    .settings-signout-btn:hover {
      background: rgba(180, 35, 24, 0.06);
    }

    @media (max-width: 520px) {
      .settings-dl__row {
        grid-template-columns: 1fr;
        gap: 0.35rem;
      }
    }
  `
})
export class SettingsHomePageComponent implements OnInit {
  protected readonly settings = inject(SettingsService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly merchantSearch = inject(MerchantSearchService);

  protected readonly passwordJustUpdated = signal(false);

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('pwdUpdated') === '1') {
      this.passwordJustUpdated.set(true);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }
  }

  protected get session(): AuthSession | null {
    return this.authService.getSession();
  }

  protected displayName(s: AuthSession | null): string {
    if (!s) {
      return '—';
    }
    const full = [s.firstName, s.lastName]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean)
      .join(' ')
      .trim();
    return full || s.email?.trim() || '—';
  }

  protected roleLabel(s: AuthSession | null): string {
    const raw = s?.userCategory?.trim();
    if (!raw) {
      return 'Merchant Admin';
    }
    return titleCase(raw.replace(/_/g, ' '));
  }

  protected signOut(): void {
    this.authService.logout();
    this.merchantSearch.reset();
    void this.router.navigate(['/auth/login']);
  }
}
