import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

          <form class="auth-form">
            <label>
              <span>Email address</span>
              <input type="email" placeholder="team@101premium.com" />
            </label>

            <button type="button" class="primary-btn">Send reset link</button>
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
export class ForgotPasswordPageComponent {}
