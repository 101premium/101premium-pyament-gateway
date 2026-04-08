import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../data/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen flex-col bg-[#f8f9fb]">
      <main class="flex flex-1 items-center justify-center px-6 pb-12 pt-28">
        <div class="flex w-full max-w-[480px] flex-col items-center gap-8">
          <div class="flex items-center justify-center">
            <img
              src="/logo/101premiun_logo.png"
              alt="101Premium logo"
              class="h-auto w-[120px] object-contain max-sm:w-[150px]"
            />
          </div>

          <section class="w-full rounded-3xl bg-white px-12 py-16 shadow-[0_18px_50px_rgba(35,49,70,0.05)] max-sm:px-6 max-sm:py-10">
            <div class="text-center">
              <h1 class="font-[Manrope] text-5xl font-bold tracking-[-0.04em] text-[#2d3337] max-sm:text-[40px]">
                Sign In
              </h1>
              <p class="mt-3 text-base leading-6 text-[#5a6064]">
                Welcome back! Enter your details to continue.
              </p>
            </div>

            <form class="mt-10 grid gap-6" [formGroup]="loginForm" (ngSubmit)="submit()">
              <label class="grid gap-2">
                <span class="text-sm font-medium leading-5 text-[#2d3337]">Email address</span>
                <div class="relative">
                  <span
                    class="pointer-events-none absolute left-4 top-1/2 inline-flex -translate-y-1/2 text-[#767b7f]"
                    aria-hidden="true"
                  >
                    <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 6h16v12H4z" />
                      <path d="m4 8 8 6 8-6" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    formControlName="email"
                    class="h-[51px] w-full rounded-[24px] border border-transparent bg-[#f1f4f7] pl-11 pr-4 text-base leading-[19px] text-[#2d3337] outline-none transition focus:border-[rgba(96,123,254,0.28)] focus:shadow-[0_0_0_4px_rgba(96,123,254,0.12)] placeholder:text-[rgba(118,123,127,0.6)]"
                  />
                </div>
                <span class="text-xs font-medium text-[#d14343]" *ngIf="emailInvalid()">
                  Enter a valid email address.
                </span>
              </label>

              <label class="grid gap-2">
                <span class="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
                  <span class="text-sm font-medium leading-5 text-[#2d3337]">Password</span>
                  <a
                    routerLink="/auth/forgot-password"
                    class="text-xs font-semibold leading-4 text-[#3452d4]"
                  >
                    Forgot Password?
                  </a>
                </span>
                <div class="relative">
                  <span
                    class="pointer-events-none absolute left-4 top-1/2 inline-flex -translate-y-1/2 text-[#767b7f]"
                    aria-hidden="true"
                  >
                    <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                      <circle cx="12" cy="15" r="1" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    formControlName="password"
                    class="h-[51px] w-full rounded-[24px] border border-transparent bg-[#f1f4f7] pl-11 pr-12 text-base leading-[19px] text-[#2d3337] outline-none transition focus:border-[rgba(96,123,254,0.28)] focus:shadow-[0_0_0_4px_rgba(96,123,254,0.12)] placeholder:text-[rgba(118,123,127,0.6)]"
                  />
                  <span
                    class="pointer-events-none absolute right-4 top-1/2 inline-flex -translate-y-1/2 text-[#767b7f]"
                    aria-hidden="true"
                  >
                    <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </span>
                </div>
                <span class="text-xs font-medium text-[#d14343]" *ngIf="passwordInvalid()">
                  Password must be at least 6 characters.
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
                class="inline-flex min-h-14 items-center justify-center rounded-[24px] bg-[var(--primary)] px-4 text-base font-semibold leading-6 text-[#faf8ff] shadow-[0_10px_15px_-3px_rgba(30,90,46,0.18),0_4px_6px_-4px_rgba(30,90,46,0.18)] transition hover:-translate-y-px hover:opacity-95"
              >
                {{ isSubmitting() ? 'Signing In...' : 'Sign In' }}
              </button>
            </form>
          </section>
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
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly emailInvalid = computed(() => {
    const control = this.loginForm.controls.email;
    return control.invalid && (control.dirty || control.touched);
  });

  protected readonly passwordInvalid = computed(() => {
    const control = this.loginForm.controls.password;
    return control.invalid && (control.dirty || control.touched);
  });

  protected submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService
      .login(this.loginForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(response.description);
          void this.router.navigate(['/dashboard']);
        },
        error: (error: HttpErrorResponse) => {
          const apiMessage =
            typeof error.error?.description === 'string' ? error.error.description : null;

          this.errorMessage.set(apiMessage ?? 'Unable to sign in right now. Please try again.');
        }
      });
  }
}
