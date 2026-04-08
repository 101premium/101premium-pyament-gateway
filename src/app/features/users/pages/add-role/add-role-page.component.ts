import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { RolesService } from '../../data/roles.service';
import { PermissionOption } from '../../data/users.models';

@Component({
  selector: 'app-add-role-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="dashboard-main merchant-main grid gap-5">
      <section class="grid gap-2 border-b border-[rgba(138,158,191,0.16)] pb-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">
              Teams
            </p>
            <h1 class="mt-1 mb-0 text-[clamp(1.45rem,2.2vw,1.9rem)] font-bold leading-tight tracking-[-0.025em] text-[#2a3340]">
              Add role
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
          Create a new role and assign permissions from the live permission list.
        </p>
      </section>

      <section class="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_360px]">
        <article class="merchant-panel grid gap-4 rounded-[1.8rem] p-6">
          <form class="grid gap-4" [formGroup]="roleForm" (ngSubmit)="submitRole()">
            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Role name</span>
              <input
                class="h-12 rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 outline-none"
                formControlName="name"
                placeholder="Operations Manager"
              />
            </label>

            <label class="grid gap-2">
              <span class="text-sm font-semibold text-[#42526b]">Description</span>
              <textarea
                rows="4"
                class="rounded-2xl border border-[rgba(138,158,191,0.24)] bg-[#f8fbff] px-4 py-3 outline-none"
                formControlName="description"
                placeholder="Can review activity, approve roles, and oversee merchant operations."
              ></textarea>
            </label>

            <div class="grid gap-3">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-[#42526b]">Permissions</span>
                <button
                  type="button"
                  class="rounded-full border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)]"
                  (click)="loadPermissions()"
                >
                  Refresh
                </button>
              </div>

              <div
                *ngIf="permissionsLoading()"
                class="rounded-2xl border border-[rgba(138,158,191,0.16)] bg-[#f8fbff] px-4 py-3 text-sm text-[#607089]"
              >
                Loading permissions...
              </div>

              <div
                *ngIf="permissionsError()"
                class="rounded-2xl border border-[#ffd7d3] bg-[#fff6f5] px-4 py-3 text-sm text-[#b42318]"
              >
                {{ permissionsError() }}
              </div>

              <div
                *ngIf="!permissionsLoading() && !permissionsError()"
                class="grid max-h-[24rem] gap-3 overflow-auto rounded-[1.4rem] border border-[rgba(138,158,191,0.16)] bg-[#fbfcff] p-4"
              >
                <div *ngFor="let group of permissionGroups()" class="grid gap-3">
                  <div class="sticky top-0 z-[1] rounded-xl bg-[#eef4ff] px-3 py-2">
                    <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#4f6280]">
                      {{ group.menuName }}
                    </p>
                  </div>

                  <div class="grid gap-3">
                    <label
                      *ngFor="let permission of group.permissions"
                      class="flex items-start gap-3 rounded-2xl border border-[rgba(138,158,191,0.14)] bg-white px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        class="mt-1 h-4 w-4 accent-[var(--primary)]"
                        [checked]="selectedPermissionIds().includes(permission.id)"
                        (change)="togglePermission(permission.id, $any($event.target).checked)"
                      />
                      <span class="grid gap-1">
                        <strong class="text-sm text-[#2f3743]">{{ permission.name }}</strong>
                        <span class="text-xs leading-5 text-[#607089]">{{ permission.description }}</span>
                      </span>
                    </label>
                  </div>
                </div>

                <p *ngIf="!permissionGroups().length" class="m-0 text-sm text-[#607089]">
                  No permissions available right now.
                </p>
              </div>
            </div>

            <div
              *ngIf="roleFormError()"
              class="rounded-2xl border border-[#ffd7d3] bg-[#fff6f5] px-4 py-3 text-sm text-[#b42318]"
            >
              {{ roleFormError() }}
            </div>

            <div
              *ngIf="roleSuccessMessage()"
              class="rounded-2xl border border-[#d8efdc] bg-[#edf9ef] px-4 py-3 text-sm text-[#1c7f3d]"
            >
              {{ roleSuccessMessage() }}
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                class="primary-btn min-w-[180px]"
                [disabled]="isSubmittingRole()"
              >
                {{ isSubmittingRole() ? 'Saving Role...' : 'Save Role' }}
              </button>
            </div>
          </form>
        </article>

        <aside class="merchant-panel grid gap-4 rounded-[1.8rem] p-6">
          <div>
            <p class="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-[#8fa0b8]">Role Preview</p>
            <h2 class="mt-2 mb-0 text-xl font-bold text-[#2f3743]">{{ rolePreview().name }}</h2>
            <p class="mt-2 mb-0 text-sm leading-6 text-[#607089]">{{ rolePreview().description }}</p>
          </div>

          <div class="rounded-[1.4rem] bg-[#f8fbff] p-4">
            <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#91a0bb]">Selected Permissions</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                *ngFor="let permission of selectedPermissions()"
                class="rounded-full bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]"
              >
                {{ permission.name }}
              </span>
              <span *ngIf="!selectedPermissions().length" class="text-sm text-[#607089]">
                No permissions selected yet.
              </span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  `
})
export class AddRolePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly rolesService = inject(RolesService);

  protected readonly permissions = signal<PermissionOption[]>([]);
  protected readonly permissionsLoading = signal(false);
  protected readonly permissionsError = signal('');
  protected readonly selectedPermissionIds = signal<number[]>([]);
  protected readonly roleFormError = signal('');
  protected readonly roleSuccessMessage = signal('');
  protected readonly isSubmittingRole = signal(false);
  protected readonly roleForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required]
  });
  protected readonly selectedPermissions = computed(() =>
    this.permissions().filter((permission) => this.selectedPermissionIds().includes(permission.id))
  );
  protected readonly permissionGroups = computed(() => {
    const groups = new Map<string, PermissionOption[]>();

    for (const permission of this.permissions()) {
      const key = permission.menuName || 'Other';
      const existing = groups.get(key) ?? [];
      existing.push(permission);
      groups.set(key, existing);
    }

    return Array.from(groups.entries())
      .map(([menuName, permissions]) => ({
        menuName,
        permissions: [...permissions].sort((left, right) => left.name.localeCompare(right.name))
      }))
      .sort((left, right) => left.menuName.localeCompare(right.menuName));
  });
  protected readonly rolePreview = computed(() => ({
    name: this.roleForm.controls.name.getRawValue() || 'Role name',
    description: this.roleForm.controls.description.getRawValue() || 'Role description'
  }));

  constructor() {
    this.loadPermissions();
  }

  protected loadPermissions(): void {
    this.permissionsLoading.set(true);
    this.permissionsError.set('');

    this.rolesService
      .getPermissions()
      .pipe(finalize(() => this.permissionsLoading.set(false)))
      .subscribe({
        next: (permissions) => {
          this.permissions.set(permissions.filter((permission) => permission.id > 0));
        },
        error: (error: unknown) => {
          this.permissions.set([]);
          this.permissionsError.set(this.resolvePermissionErrorMessage(error));
        }
      });
  }

  protected togglePermission(permissionId: number, checked: boolean): void {
    this.selectedPermissionIds.update((ids) => {
      if (checked) {
        return ids.includes(permissionId) ? ids : [...ids, permissionId];
      }

      return ids.filter((id) => id !== permissionId);
    });
  }

  protected submitRole(): void {
    this.roleFormError.set('');
    this.roleSuccessMessage.set('');

    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      this.roleFormError.set('Provide a role name and description.');
      return;
    }

    if (!this.selectedPermissionIds().length) {
      this.roleFormError.set('Select at least one permission for this role.');
      return;
    }

    this.isSubmittingRole.set(true);

    const now = new Date().toISOString();
    const payload = {
      name: this.roleForm.controls.name.getRawValue(),
      description: this.roleForm.controls.description.getRawValue(),
      permissions: this.selectedPermissionIds().map((permissionId) => ({
        id: 0,
        roleId: 0,
        permissionId,
        createdDate: now
      }))
    };

    this.rolesService
      .createRole(payload)
      .pipe(finalize(() => this.isSubmittingRole.set(false)))
      .subscribe({
        next: () => {
          this.roleSuccessMessage.set(`Role ${payload.name} created successfully.`);
          this.roleForm.reset({ name: '', description: '' });
          this.selectedPermissionIds.set([]);
        },
        error: (error: unknown) => {
          this.roleFormError.set(this.resolveRoleSubmitErrorMessage(error));
        }
      });
  }

  private resolvePermissionErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) {
        return error.error.description;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Unable to load permissions right now.';
  }

  private resolveRoleSubmitErrorMessage(error: unknown): string {
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

    return 'Unable to create role right now.';
  }
}
