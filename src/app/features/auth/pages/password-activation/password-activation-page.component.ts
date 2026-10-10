import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../data/auth.service';

@Component({
  selector: 'app-password-activation-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen flex-col bg-[#f8f9fb]">
      <main class="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div class="mb-6 flex w-full justify-center">
          <img
            src="/logo/101premiun_logo.png"
            alt="101Premium logo"
            class="h-auto w-[120px] object-contain max-sm:w-[150px]"
          />
        </div>
        <div class="w-full max-w-[560px] rounded-[32px] bg-white px-8 py-10 shadow-[0_18px_50px_rgba(35,49,70,0.05)] max-sm:px-6">
          <h1 class="m-0 font-[Manrope] text-[clamp(2.2rem,5vw,3.2rem)] font-bold tracking-[-0.05em] text-[#2d3337]">
            Set a new password
          </h1>
          <p class="mt-4 text-base leading-7 text-[#5a6064]">
            Choose a fresh password for your account and confirm it to finish resetting access.
          </p>

          <form class="mt-8 grid gap-5" [formGroup]="form" (ngSubmit)="submit()">
            <label class="grid gap-2">
              <span class="text-sm font-medium leading-5 text-[#2d3337]">New password</span>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="new-password"
                  placeholder="At least 8 characters"
                  class="h-[54px] w-full rounded-[22px] border border-transparent bg-[#f1f4f7] px-4 pr-12 text-base leading-[19px] text-[#2d3337] outline-none transition focus:border-[rgba(96,123,254,0.28)] focus:shadow-[0_0_0_4px_rgba(96,123,254,0.12)] placeholder:text-[rgba(118,123,127,0.7)]"
                />
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  [attr.aria-pressed]="showPassword()"
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  class="absolute right-2 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent p-0 text-[#5f6569] transition hover:bg-black/5 hover:text-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  @if (showPassword()) {
                    <!-- Heroicons: eye-slash 24 outline — https://heroicons.com (MIT) -->
                    <svg
                      class="pointer-events-none h-5 w-5 shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  } @else {
                    <!-- Heroicons: eye 24 outline — https://heroicons.com (MIT) -->
                    <svg
                      class="pointer-events-none h-5 w-5 shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  }
                </button>
              </div>
              <span class="text-xs font-medium text-[#d14343]" *ngIf="passwordInvalid()">
                Password must be at least 8 characters.
              </span>
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-medium leading-5 text-[#2d3337]">Confirm password</span>
              <div class="relative">
                <input
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  placeholder="Retype your new password"
                  class="h-[54px] w-full rounded-[22px] border border-transparent bg-[#f1f4f7] px-4 pr-12 text-base leading-[19px] text-[#2d3337] outline-none transition focus:border-[rgba(96,123,254,0.28)] focus:shadow-[0_0_0_4px_rgba(96,123,254,0.12)] placeholder:text-[rgba(118,123,127,0.7)]"
                />
                <button
                  type="button"
                  (click)="toggleConfirmPasswordVisibility()"
                  [attr.aria-pressed]="showConfirmPassword()"
                  [attr.aria-label]="showConfirmPassword() ? 'Hide confirm password' : 'Show confirm password'"
                  class="absolute right-2 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl border-0 bg-transparent p-0 text-[#5f6569] transition hover:bg-black/5 hover:text-[var(--primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  @if (showConfirmPassword()) {
                    <!-- Heroicons: eye-slash 24 outline — https://heroicons.com (MIT) -->
                    <svg
                      class="pointer-events-none h-5 w-5 shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  } @else {
                    <!-- Heroicons: eye 24 outline — https://heroicons.com (MIT) -->
                    <svg
                      class="pointer-events-none h-5 w-5 shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  }
                </button>
              </div>
              <span class="text-xs font-medium text-[#d14343]" *ngIf="confirmPasswordInvalid()">
                Confirm your new password.
              </span>
              <span class="text-xs font-medium text-[#d14343]" *ngIf="passwordMismatch()">
                Passwords do not match.
              </span>
            </label>

            <div
              *ngIf="errorMessage()"
              class="rounded-[20px] border border-[#ffd6d6] bg-[#fff4f4] px-4 py-3 text-sm font-medium text-[#b63b3b]"
            >
              {{ errorMessage() }}
            </div>

            <div
              *ngIf="successMessage()"
              class="rounded-[20px] border border-[#d8efdc] bg-[#edf9ef] px-4 py-3 text-sm font-medium text-[#1c7f3d]"
            >
              {{ successMessage() }}
            </div>

            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="inline-flex min-h-14 items-center justify-center rounded-[24px] bg-[var(--primary)] px-4 text-base font-semibold leading-6 text-[#faf8ff] shadow-[0_10px_15px_-3px_rgba(30,90,46,0.18),0_4px_6px_-4px_rgba(30,90,46,0.18)] transition hover:-translate-y-px hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {{ isSubmitting() ? 'Updating password...' : 'Update password' }}
            </button>

          </form>

          <div class="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[#5a6064]">
            <a routerLink="/auth/login" class="font-semibold text-[#3452d4]">Back to sign in</a>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class PasswordActivationPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);
  private readonly userId = this.route.snapshot.paramMap.get('userId')?.trim() ?? '';
  private readonly resetToken = this.route.snapshot.paramMap.get('resetToken')?.trim() ?? '';

  protected togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  protected readonly form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  protected readonly passwordInvalid = computed(() => {
    const control = this.form.controls.password;
    return control.invalid && (control.dirty || control.touched);
  });

  protected readonly confirmPasswordInvalid = computed(() => {
    const control = this.form.controls.confirmPassword;
    return control.hasError('required') && (control.dirty || control.touched);
  });

  protected readonly passwordMismatch = computed(() => {
    const confirmPassword = this.form.controls.confirmPassword;
    return (
      !!confirmPassword.value &&
      confirmPassword.value !== this.form.controls.password.value &&
      (confirmPassword.dirty || confirmPassword.touched)
    );
  });

  protected submit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.userId || !this.resetToken) {
      this.errorMessage.set('This password reset link is incomplete. Request a new link and try again.');
      return;
    }

    if (this.passwordMismatch()) {
      this.form.controls.confirmPassword.markAsTouched();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { password } = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.authService
      .activatePassword({
        uniqueId: this.userId,
        resetToken: this.resetToken,
        password
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.description || 'Your password has been updated successfully.');
          this.form.controls.password.reset('');
          this.form.controls.confirmPassword.reset('');
          this.showPassword.set(false);
          this.showConfirmPassword.set(false);
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
            apiMessage ?? 'We could not update your password. Your reset link may have expired.'
          );
        }
      });
  }
}
