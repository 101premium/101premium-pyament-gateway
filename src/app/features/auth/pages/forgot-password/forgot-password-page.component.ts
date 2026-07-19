import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../data/auth.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page compact">
      <section class="form-panel wide">
        <div class="mb-6 flex justify-center">
          <img
            src="/logo/101premiun_logo.png"
            alt="101Premium logo"
            class="h-auto w-[120px] object-contain max-sm:w-[150px]"
          />
        </div>
        <div class="form-card">
          <p class="eyebrow">Password recovery</p>
          <h2>Reset your access</h2>
          <p class="form-copy">
            Enter the email connected to your workspace and we will send reset instructions.
          </p>

          <form class="auth-form" [formGroup]="forgotPasswordForm" (ngSubmit)="submit()">
            <label>
              <span>Email address</span>
              <input
                type="email"
                placeholder="team@101premium.com"
                formControlName="email"
                autocomplete="email"
              />
              <small class="text-xs font-medium text-[#d14343]" *ngIf="emailInvalid()">
                Enter a valid email address.
              </small>
            </label>

            <div
              *ngIf="errorMessage()"
              class="rounded-[20px] border border-[#ffd6d6] bg-[#fff4f4] px-4 py-3 text-sm font-medium text-[#b63b3b]"
              role="alert"
            >
              {{ errorMessage() }}
            </div>

            <div
              *ngIf="successMessage()"
              class="rounded-[20px] border border-[#d8efdc] bg-[#edf9ef] px-4 py-3 text-sm font-medium text-[#1c7f3d]"
              role="status"
            >
              {{ successMessage() }}
            </div>

            <button type="submit" class="primary-btn" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Sending...' : 'Send reset link' }}
            </button>
          </form>

          <p class="footnote">
            Remembered your password?
            <a routerLink="/auth/login">Back to sign in</a>
          </p>
        </div>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  protected readonly emailInvalid = computed(() => {
    const control = this.forgotPasswordForm.controls.email;
    return control.invalid && (control.dirty || control.touched);
  });

  protected submit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService
      .forgotPassword(this.forgotPasswordForm.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(
            response.description || 'Password reset instructions have been sent to your email.'
          );
        },
        error: (error: HttpErrorResponse) => {
          const apiMessage =
            typeof error.error?.description === 'string'
              ? error.error.description
              : typeof error.error?.message === 'string'
                ? error.error.message
                : null;

          this.errorMessage.set(
            apiMessage || 'Unable to send password reset instructions right now. Please try again.'
          );
        }
      });
  }
}
