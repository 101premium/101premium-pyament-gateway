import { HttpClient } from '@angular/common/http';
import { ToastService } from '../services/toast.service';

/**
 * Triggers a file download from a remote URL.
 * Handles HTTP -> HTTPS protocol upgrades, strips redundant :80 ports,
 * and attempts a Blob fetch to bypass browser mixed-content and popup blocking.
 */
export function triggerFileDownload(
  http: HttpClient,
  rawUrl: string | null | undefined,
  toastService: ToastService,
  defaultFilename = 'download.xlsx',
  successMessage = 'File downloaded successfully.'
): void {
  const urlStr = rawUrl?.trim() ?? '';
  if (!urlStr) {
    toastService.show('The server did not return a valid download link.');
    return;
  }

  // Normalize protocol and port to prevent HTTPS -> HTTP mixed content blocking
  let normalizedUrl = urlStr;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    normalizedUrl = normalizedUrl
      .replace(/^http:\/\//i, 'https://')
      .replace(/:80(\/|$)/, '$1');
  }

  // Extract clean filename from URL path
  let filename = defaultFilename;
  try {
    const parsed = new URL(normalizedUrl);
    const extracted = decodeURIComponent(parsed.pathname.split('/').pop() ?? '').trim();
    if (extracted) {
      filename = extracted;
    }
  } catch {
    // ignore parse error, use defaultFilename
  }

  // Attempt downloading as a Blob first (guarantees local same-origin blob download)
  http.get(normalizedUrl, { responseType: 'blob' }).subscribe({
    next: (blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toastService.show(successMessage, 'success');
    },
    error: () => {
      // Fallback: direct anchor click if CORS prevents direct blob fetch
      try {
        const link = document.createElement('a');
        link.href = normalizedUrl;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toastService.show(successMessage, 'success');
      } catch {
        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
      }
    }
  });
}
