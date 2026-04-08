import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../auth/data/auth.service';

function passwordsMatchGroup(control: AbstractControl): ValidationErrors | null {
  const newPwd = control.get('newPassword')?.value ?? '';
  const confirm = control.get('confirmPassword')?.value ?? '';
  if (!confirm) {
    return null;
  }
  return newPwd === confirm ? null : { confirmMismatch: true };
}

function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const password = `${control.value ?? ''}`;

  if (!password) {
    return null;
  }

  const isValid =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  return isValid ? null : { weakPassword: true };
}

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="dashboard-main merchant-main grid max-w-[560px] gap-x-5 gap-y-5">
      <a
        routerLink="/settings"
        class="inline-flex w-fit items-center gap-1.5 text-[0.9rem] font-semibold text-[var(--primary)] no-underline hover:underline"
      >
        ← Back to settings
      </a>

      <header
        class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[rgba(138,158,191,0.16)] pb-1.5"
      >
        <div>
          <p class="mb-1 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">
            Security
          </p>
          <h1 class="m-0 text-[clamp(1.45rem,2.2vw,1.85rem)] font-bold leading-[1.2] tracking-[-0.025em] text-[#2a3340]">
            Change password
          </h1>
        </div>
      </header>

      <article class="merchant-panel merchant-panel--settings">
        <p class="settings-lead">
          Enter your current password, then choose a new one with uppercase, lowercase, number,
          and special character.
        </p>

        <form class="settings-password-form" [formGroup]="form" (ngSubmit)="submit()">
          <label class="settings-field">
            <span>Current password</span>
            <div class="settings-field__input-wrap">
              <input
                [type]="showCurrentPassword() ? 'text' : 'password'"
                formControlName="currentPassword"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="settings-field__toggle"
                (click)="showCurrentPassword.set(!showCurrentPassword())"
                [attr.aria-label]="showCurrentPassword() ? 'Hide current password' : 'Show current password'"
              >
                <svg
                  *ngIf="!showCurrentPassword(); else hideCurrentPasswordIcon"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <span class="settings-field__error" *ngIf="currentInvalid()">Current password is required.</span>
          </label>

          <label class="settings-field">
            <span>New password</span>
            <div class="settings-field__input-wrap">
              <input
                [type]="showNewPassword() ? 'text' : 'password'"
                formControlName="newPassword"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="settings-field__toggle"
                (click)="showNewPassword.set(!showNewPassword())"
                [attr.aria-label]="showNewPassword() ? 'Hide new password' : 'Show new password'"
              >
                <svg
                  *ngIf="!showNewPassword(); else hideNewPasswordIcon"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <span class="settings-field__error" *ngIf="newInvalid()">
              Use at least 8 characters with uppercase, lowercase, number, and special character.
            </span>
          </label>

          <label class="settings-field">
            <span>Confirm new password</span>
            <div class="settings-field__input-wrap">
              <input
                [type]="showConfirmPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="settings-field__toggle"
                (click)="showConfirmPassword.set(!showConfirmPassword())"
                [attr.aria-label]="showConfirmPassword() ? 'Hide confirm password' : 'Show confirm password'"
              >
                <svg
                  *ngIf="!showConfirmPassword(); else hideConfirmPasswordIcon"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <span class="settings-field__error" *ngIf="confirmInvalid()">Confirm your new password.</span>
            <span class="settings-field__error" *ngIf="confirmMismatch()">Passwords do not match.</span>
          </label>

          <div *ngIf="errorMessage()" class="settings-banner settings-banner--error">
            {{ errorMessage() }}
          </div>

          <div class="settings-form-actions">
            <button type="submit" class="settings-submit-btn" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Updating…' : 'Update password' }}
            </button>
          </div>

          <ng-template #hideCurrentPasswordIcon>
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="m3 3 18 18" />
              <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
              <path d="M9.4 5.3A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4.1 4.8" />
              <path d="M6.2 6.2A17.2 17.2 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5.1-1.3" />
            </svg>
          </ng-template>

          <ng-template #hideNewPasswordIcon>
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="m3 3 18 18" />
              <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
              <path d="M9.4 5.3A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4.1 4.8" />
              <path d="M6.2 6.2A17.2 17.2 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5.1-1.3" />
            </svg>
          </ng-template>

          <ng-template #hideConfirmPasswordIcon>
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="m3 3 18 18" />
              <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
              <path d="M9.4 5.3A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4.1 4.8" />
              <path d="M6.2 6.2A17.2 17.2 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5.1-1.3" />
            </svg>
          </ng-template>
        </form>
      </article>
    </main>
  `,
  styles: `
    .merchant-panel--settings {
      padding: 1.55rem;
      border-radius: 1.8rem;
    }

    .settings-lead {
      margin: 0 0 1.25rem;
      font-size: 0.92rem;
      line-height: 1.5;
      color: #5d6d88;
    }

    .settings-password-form {
      display: grid;
      gap: 1.15rem;
    }

    .settings-field {
      display: grid;
      gap: 0.4rem;
    }

    .settings-field span:first-child {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #7a8aa3;
    }

    .settings-field input {
      min-height: 2.85rem;
      padding: 0 1rem;
      border-radius: 0.85rem;
      border: 1px solid rgba(138, 158, 191, 0.35);
      background: rgba(255, 255, 255, 0.95);
      color: #2a3340;
      font-size: 0.95rem;
    }

    .settings-field__input-wrap {
      position: relative;
    }

    .settings-field__input-wrap input {
      padding-right: 3rem;
    }

    .settings-field input:focus {
      outline: 2px solid color-mix(in srgb, var(--primary) 35%, transparent);
      outline-offset: 1px;
      border-color: color-mix(in srgb, var(--primary) 45%, transparent);
    }

    .settings-field__toggle {
      position: absolute;
      top: 50%;
      right: 0.95rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 0;
      background: transparent;
      color: #7a8aa3;
      transform: translateY(-50%);
      cursor: pointer;
    }

    .settings-field__toggle:hover {
      color: var(--primary);
    }

    .settings-field__error {
      font-size: 0.82rem;
      font-weight: 600;
      color: #b42318;
    }

    .settings-banner {
      margin: 0;
      padding: 0.85rem 1rem;
      border-radius: 0.85rem;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .settings-banner--error {
      border: 1px solid rgba(180, 35, 24, 0.25);
      background: rgba(255, 244, 244, 0.95);
      color: #9f2a20;
    }

    .settings-form-actions {
      margin-top: 0.25rem;
    }

    .settings-submit-btn {
      min-height: 2.85rem;
      padding: 0 1.5rem;
      border: 0;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 10px 22px color-mix(in srgb, var(--primary) 22%, transparent);
    }

    .settings-submit-btn:hover:not(:disabled) {
      opacity: 0.95;
    }

    .settings-submit-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  `
})
export class ChangePasswordPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showCurrentPassword = signal(false);
  protected readonly showNewPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  protected readonly form = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, strongPasswordValidator]],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordsMatchGroup }
  );

  constructor() {
    this.form.controls.newPassword.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.form.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected readonly currentInvalid = computed(() => {
    const c = this.form.controls.currentPassword;
    return c.invalid && (c.dirty || c.touched);
  });

  protected readonly newInvalid = computed(() => {
    const c = this.form.controls.newPassword;
    return c.invalid && (c.dirty || c.touched);
  });

  protected readonly confirmInvalid = computed(() => {
    const c = this.form.controls.confirmPassword;
    return c.hasError('required') && (c.dirty || c.touched);
  });

  protected readonly confirmMismatch = computed(() => {
    const c = this.form.controls.confirmPassword;
    return this.form.hasError('confirmMismatch') && (c.dirty || c.touched) && !!c.value;
  });

  protected submit(): void {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.authService
      .changePassword({ previousPassword: currentPassword, password: newPassword })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.form.reset();
          void this.router.navigate(['/settings'], { queryParams: { pwdUpdated: '1' } });
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error;
          const apiMessage =
            typeof body?.description === 'string'
              ? body.description
              : typeof body?.message === 'string'
                ? body.message
                : null;
          this.errorMessage.set(
            apiMessage ?? 'Could not update your password. Check your current password and try again.'
          );
        }
      });
  }
}
