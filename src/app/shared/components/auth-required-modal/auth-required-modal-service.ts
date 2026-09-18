import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthRequiredModalService {
  private readonly _isOpen = signal(false);
  private readonly _message = signal('Você precisa estar logado para continuar.');
  private readonly _returnUrl = signal<string | null>(null);

  readonly isOpen = this._isOpen.asReadonly();
  readonly message = this._message.asReadonly();
  readonly returnUrl = this._returnUrl.asReadonly();

  show(message?: string, returnUrl?: string): void {
    this._message.set(message ?? 'Você precisa estar logado para continuar.');
    this._returnUrl.set(returnUrl ?? null);
    this._isOpen.set(true);
  }

  hide(): void {
    this._isOpen.set(false);
  }
}