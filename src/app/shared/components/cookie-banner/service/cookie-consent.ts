import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'cookie-consent';

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private readonly _accepted = signal<boolean>(this.readStoredConsent());
  readonly accepted = this._accepted.asReadonly();

  accept(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accepted: true, acceptedAt: new Date().toISOString() }),
      );
    } catch {

    }
    this._accepted.set(true);
  }

  private readStoredConsent(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed: unknown = JSON.parse(raw);
      return (
        typeof parsed === 'object' &&
        parsed !== null &&
        (parsed as { accepted?: boolean }).accepted === true
      );
    } catch {
      return false;
    }
  }
}