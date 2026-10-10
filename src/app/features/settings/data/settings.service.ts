import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MerchantPreferences } from './settings.models';

const STORAGE_KEY = '101premium.merchant.preferences';

const defaults: MerchantPreferences = {
  emailNotifications: true,
  paymentAlerts: true,
  settlementAlerts: false
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly state = signal<MerchantPreferences>(this.readStored());

  readonly preferences = this.state.asReadonly();

  readonly emailNotifications = computed(() => this.state().emailNotifications);
  readonly paymentAlerts = computed(() => this.state().paymentAlerts);
  readonly settlementAlerts = computed(() => this.state().settlementAlerts);

  setEmailNotifications(value: boolean): void {
    this.patch({ emailNotifications: value });
  }

  setPaymentAlerts(value: boolean): void {
    this.patch({ paymentAlerts: value });
  }

  setSettlementAlerts(value: boolean): void {
    this.patch({ settlementAlerts: value });
  }

  private patch(partial: Partial<MerchantPreferences>): void {
    const next = { ...this.state(), ...partial };
    this.state.set(next);
    this.persist(next);
  }

  private readStored(): MerchantPreferences {
    if (!isPlatformBrowser(this.platformId)) {
      return { ...defaults };
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaults };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<MerchantPreferences>;
      return {
        emailNotifications: typeof parsed.emailNotifications === 'boolean' ? parsed.emailNotifications : defaults.emailNotifications,
        paymentAlerts: typeof parsed.paymentAlerts === 'boolean' ? parsed.paymentAlerts : defaults.paymentAlerts,
        settlementAlerts:
          typeof parsed.settlementAlerts === 'boolean' ? parsed.settlementAlerts : defaults.settlementAlerts
      };
    } catch {
      return { ...defaults };
    }
  }

  private persist(prefs: MerchantPreferences): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }
}
