import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HelpAiService {
  private readonly http = inject(HttpClient);

  /** Returns assistant reply text (API or local fallback). */
  ask(message: string): Observable<string> {
    const trimmed = message.trim();
    if (!trimmed) {
      return of('');
    }

    const url = environment.helpAiChatUrl?.trim();
    if (!url) {
      return of(this.localAssistantReply(trimmed)).pipe(delay(380));
    }

    return this.http.post<unknown>(url, { message: trimmed }).pipe(
      map((body) => this.parseRemoteReply(body)),
      catchError((err: HttpErrorResponse) => of(this.formatAskError(err)))
    );
  }

  readonly usesRemote = (): boolean => !!environment.helpAiChatUrl?.trim();

  private parseRemoteReply(body: unknown): string {
    if (body == null) {
      return 'No response from the help service.';
    }
    if (typeof body === 'string') {
      return body.trim() || 'No response from the help service.';
    }
    if (typeof body !== 'object') {
      return String(body);
    }
    const o = body as Record<string, unknown>;
    const data = o['data'];
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      const fromData =
        pickString(d['message']) ??
        pickString(d['reply']) ??
        pickString(d['content']) ??
        pickString(d['text']);
      if (fromData) {
        return fromData;
      }
    }
    return (
      pickString(o['message']) ??
      pickString(o['reply']) ??
      pickString(o['content']) ??
      pickString(o['description']) ??
      'Here is the update from support.'
    );
  }

  private formatAskError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body && typeof body === 'object' && 'description' in body) {
      const d = (body as { description?: unknown }).description;
      if (typeof d === 'string' && d.trim()) {
        return d.trim();
      }
    }
    if (typeof body === 'string' && body.trim()) {
      return body.trim();
    }
    return 'The help service is unavailable. Try again later or contact support.';
  }

  private localAssistantReply(message: string): string {
    const m = message.toLowerCase();

    if (m.includes('payment') || m.includes('transaction') || m.includes('payout')) {
      return (
        'Payments live under Payments in the sidebar. You can review status, search from the top bar, and open invoices or payment links from Quick Actions on the dashboard. ' +
        'If a transaction fails, check the status label and your processor settings.'
      );
    }
    if (m.includes('password') || m.includes('sign in') || m.includes('login')) {
      return (
        'Change your password while signed in under Settings → Change password. ' +
        'If you are logged out, use Forgot password on the sign-in page.'
      );
    }
    if (
      m.includes('merchant api') ||
      m.includes('merchants list') ||
      m.includes('merchants page') ||
      m.includes('/merchants')
    ) {
      return (
        'Open Merchants in the sidebar for GET /merchant/page: business profiles (name, email, merchant ID, CAC/TIN, approval status) and pagination.'
      );
    }
    if (m.includes('team') || m.includes('user') || m.includes('role')) {
      return (
        'Manage people under Teams in the sidebar. You can switch between users and roles, search, and paginate the list.'
      );
    }
    if (m.includes('audit') || m.includes('trail') || m.includes('log')) {
      return (
        'Audit Trail records important account activity. Open it from the sidebar to review events and filter as needed.'
      );
    }
    if (m.includes('invoice')) {
      return (
        'Create invoices from the dashboard Quick Actions card (Create invoice), or from your invoice tool route when available.'
      );
    }
    if (m.includes('customer')) {
      return (
        'Add customers from Quick Actions (Add customer) when that action is available in your workspace.'
      );
    }
    if (m.includes('setting') || m.includes('notif')) {
      return (
        'Open Settings for your profile, notification toggles (saved on this device), and security options including sign out.'
      );
    }
    if (m.includes('search')) {
      return (
        'Use the search field in the top bar to filter transactions and customers on supported pages.'
      );
    }
    if (m.includes('hello') || m.includes('hi ') || m === 'hi') {
      return (
        'Hi! I am the 101Premium Help assistant. Ask about payments, teams, audit trail, settings, passwords, or search.'
      );
    }

    return (
      'I cover 101Premium merchant tasks: payments and transactions, teams and roles, audit trail, settings and passwords, and the header search. ' +
      'Ask a specific question, or say “payments”, “teams”, or “settings” to get started.'
    );
  }
}

function pickString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}
