import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Observable, shareReplay, startWith } from 'rxjs';

/**
 * Shared merchant header search: one control for all layout child routes so the query
 * persists when navigating between dashboard and payment.
 */
@Injectable({ providedIn: 'root' })
export class MerchantSearchService {
  readonly control = new FormControl('', { nonNullable: true });

  readonly debouncedQuery$: Observable<string> = this.control.valueChanges.pipe(
    startWith(this.control.getRawValue()),
    debounceTime(300),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  reset(): void {
    this.control.setValue('');
  }
}
