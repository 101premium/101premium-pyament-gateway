import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PageFooterComponent } from '../../../../shared/components/page-footer/page-footer.component';
import { SettlementUploadResult } from '../../data/settlement.models';
import { SettlementService } from '../../data/settlement.service';

@Component({
  selector: 'app-settlement-upload-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PageFooterComponent],
  template: `
    <main class="dashboard-main merchant-main grid gap-5">
      <section class="grid gap-2 border-b border-[rgba(138,158,191,0.16)] pb-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="m-0 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-[#5b6c86]">Settlement</p>
            <h1 class="mt-1 mb-0 text-[clamp(1.45rem,2.2vw,1.9rem)] font-bold leading-tight tracking-[-0.025em] text-[#2a3340]">
              Upload settlement file
            </h1>
          </div>
          <a routerLink="/settlement" class="rounded-full border border-[color-mix(in_srgb,var(--primary)_24%,transparent)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)]">
            Back to settlements
          </a>
        </div>
        <p class="m-0 max-w-3xl text-sm leading-6 text-[#61708a]">
          Upload the completed Excel file to mark matching transactions as settled. Review the file before submitting because successful rows update immediately.
        </p>
      </section>

      <section class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article class="merchant-panel grid gap-5 rounded-[1.8rem] p-5 sm:p-6">
          <div>
            <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a98ad]">Settlement file</p>
            <h2 class="mt-2 mb-0 text-xl font-bold text-[#2f3743]">Choose a file to process</h2>
          </div>

          <input #fileInput type="file" class="sr-only" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" (change)="selectFromInput($event)" />
          <button
            type="button"
            class="grid min-h-[250px] place-items-center rounded-[1.5rem] border-2 border-dashed p-6 text-center transition"
            [class.border-[#175cd3]]="isDragging()"
            [class.bg-[#f4f7fc]]="isDragging()"
            [class.border-[#cfd8e6]]="!isDragging()"
            [class.bg-[#fbfcfe]]="!isDragging()"
            [disabled]="isUploading()"
            (click)="fileInput.click()"
            (dragover)="onDragOver($event)"
            (dragleave)="isDragging.set(false)"
            (drop)="onDrop($event)"
          >
            <span class="grid justify-items-center gap-3">
              <span class="grid size-14 place-items-center rounded-2xl bg-[#eaf1ff] text-[#175cd3]">
                <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" />
                </svg>
              </span>
              <span class="text-base font-bold text-[#344054]">Drop your Excel file here</span>
              <span class="text-sm text-[#667085]">or click to browse from your device</span>
              <span class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#667085] shadow-sm">.XLS or .XLSX · Maximum 10 MB</span>
            </span>
          </button>

          <div *ngIf="selectedFile() as file" class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dce5f1] bg-[#f8fbff] p-4">
            <div class="flex min-w-0 items-center gap-3">
              <span class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eaf8ef] text-[#15803d]">
                <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m8 15 2 2 5-5"/></svg>
              </span>
              <span class="min-w-0">
                <strong class="block truncate text-sm text-[#344054]">{{ file.name }}</strong>
                <span class="text-xs text-[#667085]">{{ formatFileSize(file.size) }}</span>
              </span>
            </div>
            <button type="button" class="text-sm font-semibold text-[#b42318] hover:text-[#912018]" [disabled]="isUploading()" (click)="removeFile()">Remove</button>
          </div>

          <div *ngIf="errorMessage()" class="rounded-2xl border border-[#ffd7d3] bg-[#fff6f5] px-4 py-3 text-sm text-[#b42318]">{{ errorMessage() }}</div>

          <div class="flex justify-end">
            <button type="button" class="primary-btn min-w-[190px]" [disabled]="!selectedFile() || isUploading()" (click)="upload()">
              {{ isUploading() ? 'Processing file...' : 'Upload settlement' }}
            </button>
          </div>
        </article>

        <aside class="grid content-start gap-4">
          <section class="merchant-panel grid gap-4 rounded-[1.8rem] p-5">
            <div class="grid size-10 place-items-center rounded-xl bg-[#fff5e8] text-[#c36a08]">
              <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            </div>
            <div>
              <h2 class="m-0 text-base font-bold text-[#344054]">Before you upload</h2>
              <ul class="mt-3 mb-0 grid gap-2 pl-5 text-sm leading-6 text-[#667085]">
                <li>Keep the original spreadsheet columns unchanged.</li>
                <li>Confirm every transaction ID is correct.</li>
                <li>Only Excel files up to 10 MB are accepted.</li>
              </ul>
            </div>
          </section>

          <section *ngIf="uploadResult() as result" class="merchant-panel grid gap-4 rounded-[1.8rem] p-5">
            <div>
              <p class="m-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a98ad]">Upload result</p>
              <h2 class="mt-2 mb-0 text-lg font-bold text-[#2f3743]">File processed</h2>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="rounded-xl bg-[#f4f7fb] p-3"><strong class="block text-xl text-[#344054]">{{ result.totalRecords }}</strong><span class="text-[0.7rem] text-[#667085]">Total</span></div>
              <div class="rounded-xl bg-[#edf9ef] p-3"><strong class="block text-xl text-[#15803d]">{{ result.successCount }}</strong><span class="text-[0.7rem] text-[#667085]">Successful</span></div>
              <div class="rounded-xl bg-[#fff1f0] p-3"><strong class="block text-xl text-[#b42318]">{{ result.failedCount }}</strong><span class="text-[0.7rem] text-[#667085]">Failed</span></div>
            </div>
            <div *ngIf="result.errors.length" class="grid max-h-48 gap-2 overflow-auto">
              <div *ngFor="let error of result.errors" class="rounded-xl border border-[#ffd7d3] bg-[#fff8f7] p-3 text-xs text-[#912018]">
                <strong>Row {{ error.row }}</strong><span class="block mt-1">{{ error.cellErrMsg.join(', ') }}</span>
              </div>
            </div>
          </section>
        </aside>
      </section>
      <app-page-footer />
    </main>
  `
})
export class SettlementUploadPageComponent {
  private readonly settlementService = inject(SettlementService);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isDragging = signal(false);
  protected readonly isUploading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly uploadResult = signal<SettlementUploadResult | null>(null);

  protected selectFromInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectFile(input.files?.[0]);
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragging.set(true); }
  protected onDrop(event: DragEvent): void { event.preventDefault(); this.isDragging.set(false); this.selectFile(event.dataTransfer?.files[0]); }
  protected removeFile(): void { this.selectedFile.set(null); this.errorMessage.set(''); }
  protected formatFileSize(bytes: number): string { return bytes < 1_000_000 ? `${Math.ceil(bytes / 1_000)} KB` : `${(bytes / 1_000_000).toFixed(1)} MB`; }

  protected upload(): void {
    const file = this.selectedFile();
    if (!file || this.isUploading()) return;
    this.errorMessage.set('');
    this.uploadResult.set(null);
    this.isUploading.set(true);
    this.settlementService.uploadSettlement(file).pipe(finalize(() => this.isUploading.set(false))).subscribe({
      next: (response) => { this.uploadResult.set(response.data); this.selectedFile.set(null); },
      error: (error: unknown) => this.errorMessage.set(this.resolveError(error))
    });
  }

  private selectFile(file?: File): void {
    this.errorMessage.set(''); this.uploadResult.set(null);
    if (!file) return;
    if (!/\.xlsx?$/i.test(file.name)) { this.errorMessage.set('Select an Excel settlement file (.xls or .xlsx).'); return; }
    if (file.size > 10_000_000) { this.errorMessage.set('Settlement file size cannot exceed 10 MB.'); return; }
    this.selectedFile.set(file);
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.description === 'string' && error.error.description.trim()) return error.error.description;
      if (error.status === 401) return 'Settlement session expired. Please sign in again.';
      if (error.status === 403) return 'You do not have permission to upload settlement files.';
      if (error.status === 413) return 'Settlement file size cannot exceed 10 MB.';
    }
    return 'Unable to upload the settlement file right now.';
  }
}
