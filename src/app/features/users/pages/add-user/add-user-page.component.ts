import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DigitOnlyModule } from '@uiowa/digit-only';
import { finalize, startWith } from 'rxjs';
import { RolesService } from '../../data/roles.service';
import { RoleOption } from '../../data/users.models';
import { UsersService } from '../../data/users.service';

const COUNTRY_CODE_PHONE_PATTERN = /^234\d{7,14}$/;

@Component({
  selector: 'app-add-user-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DigitOnlyModule],
  template: `
    <main class="dashboard-main merchant-main grid gap-5">
      <section class="grid gap-2 border-b border-[rgba(138,158,191,0.16)] pb-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">
              Teams
            </p>
            <h1 class="mt-1 mb-0 text-[clamp(1.45rem,2.2vw,1.9rem)] font-bold leading-tight tracking-[-0.025em] text-[#2a3340]">
              Add user
            </h1>
          </div>

          <a
            routerLink="/teams"
            class="rounded-full border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)]"
          >
            Back to teams
          </a>
        </div>
        <p class="m-0 max-w-3xl text-sm leading-6 text-[#61708a]">
          Invite a team member with their contact details and assign the right role from the live
          role list.
        </p>
      </section>

      <section class="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_360px]">
        <article class="merchant-panel grid gap-4 rounded-[1.8rem] p-4">
          <form class="grid gap-4 md:grid-cols-2" [formGroup]="userForm" (ngSubmit)="submitUser()">
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">First name</span>
              <input
                class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none"
                formControlName="firstName"
                placeholder="John"
              />
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Last name</span>
              <input
                class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none"
                formControlName="lastName"
                placeholder="Doe"
              />
            </label>

            <label class="grid gap-2 md:col-span-2">
              <span class="text-sm font-semibold text-[#42526b]">Email address</span>
              <input
                class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none"
                formControlName="email"
                placeholder="john.doe@example.com"
              />
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Phone number</span>
              <input
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                digitOnly
                class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none"
                formControlName="phone"
                placeholder="2348000000000"
              />
              <span
                *ngIf="userForm.controls.phone.touched && userForm.controls.phone.hasError('pattern')"
                class="text-xs font-medium text-[#d14343]"
              >
                Phone number must start with country code, for example 2348000000000.
              </span>
            </label>

            <label class="grid gap-2">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-[#42526b]">Role</span>
                <button
                  type="button"
                  class="rounded-full border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)]"
                  (click)="loadRoles()"
                >
                  Refresh
                </button>
              </div>

              <select
                class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none"
                formControlName="roleId"
              >
                <option [ngValue]="0">Select a role</option>
                <option *ngFor="let role of roleOptions()" [ngValue]="role.id">{{ role.name }}</option>
              </select>
            </label>

            <div
              *ngIf="rolesLoading()"
              class="rounded-2xl border border-[rgba(138,158,191,0.16)] bg-[#f8fbff] px-4 py-3 text-sm text-[#607089] md:col-span-2"
            >
              Loading roles...
            </div>

            <div
              *ngIf="rolesError()"
              class="rounded-2xl border border-[#ffd7d3] bg-[#fff6f5] px-4 py-3 text-sm text-[#b42318] md:col-span-2"
            >
              {{ rolesError() }}
            </div>

            <div
              *ngIf="formError()"
              class="rounded-2xl border border-[#ffd7d3] bg-[#fff6f5] px-4 py-3 text-sm text-[#b42318] md:col-span-2"
            >
              {{ formError() }}
            </div>

            <div
              *ngIf="successMessage()"
              class="rounded-2xl border border-[#d8efdc] bg-[#edf9ef] px-4 py-3 text-sm text-[#1c7f3d] md:col-span-2"
            >
              {{ successMessage() }}
            </div>

            <div class="md:col-span-2 flex justify-end">
              <button type="submit" class="primary-btn min-w-[180px]" [disabled]="isSubmitting()">
                {{ isSubmitting() ? 'Saving User...' : 'Save User' }}
              </button>
            </div>
          </form>
        </article>

        <aside class="merchant-panel grid rounded-[1.8rem]">
          <div>
            <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">User Preview</p>
            <h2 class="mt-2 mb-0 text-xl font-bold text-[#2f3743]">{{ preview().name }}</h2>
            <p class="mt-2 mb-0 text-sm leading-6 text-[#607089]">{{ preview().role }}</p>
          </div>

          <div class="grid gap-3 rounded-[1.4rem] bg-[#f8fbff] p-4 text-sm text-[#607089]">
            <span>{{ preview().email }}</span>
            <span>{{ preview().phone }}</span>
          </div>
        </aside>
      </section>
    </main>
  `
})
export class AddUserPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);

  protected readonly roleOptions = signal<RoleOption[]>([]);
  protected readonly rolesLoading = signal(false);
  protected readonly rolesError = signal('');
  protected readonly formError = signal('');
  protected readonly successMessage = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly userForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(COUNTRY_CODE_PHONE_PATTERN)]],
    roleId: [0, [Validators.required, Validators.min(1)]]
  });
  private readonly formValue = toSignal(
    this.userForm.valueChanges.pipe(startWith(this.userForm.getRawValue())),
    { initialValue: this.userForm.getRawValue() }
  );
  protected readonly preview = computed(() => {
    const value = this.formValue();
    const selectedRole = this.roleOptions().find((role) => role.id === value.roleId);

    return {
      name: [value.firstName, value.lastName].filter(Boolean).join(' ') || 'User name',
      email: value.email || 'user@email.com',
      phone: value.phone || '+0 000 000 0000',
      role: selectedRole?.name || 'No role selected'
    };
  });

  constructor() {
    this.loadRoles();
  }

  protected loadRoles(): void {
    this.rolesLoading.set(true);
    this.rolesError.set('');

    this.rolesService
      .getRoleOptions()
      .pipe(finalize(() => this.rolesLoading.set(false)))
      .subscribe({
        next: (roles) => {
          this.roleOptions.set(roles);
        },
        error: (error: unknown) => {
          this.roleOptions.set([]);
          this.rolesError.set(this.resolveRolesErrorMessage(error));
        }
      });
  }

  protected submitUser(): void {
    this.formError.set('');
    this.successMessage.set('');

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.formError.set('Provide first name, last name, email, a phone number with country code, and role.');
      return;
    }

    this.isSubmitting.set(true);
    const value = this.userForm.getRawValue();

    this.usersService
      .createUser({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: value.email.trim(),
        phone: value.phone.trim(),
        roleId: value.roleId
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set(`User ${[value.firstName, value.lastName].filter(Boolean).join(' ')} added successfully.`);
          this.userForm.reset({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            roleId: 0
          });
        },
        error: (error: unknown) => {
          this.formError.set(this.resolveSubmitErrorMessage(error));
        }
      });
  }

  private resolveRolesErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to load roles right now.';
  }

  private resolveSubmitErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }

      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to create user right now.';
  }
}
