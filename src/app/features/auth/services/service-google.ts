import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly clientId = environment.googleClientId;

  initialize(callback: (idToken: string) => void): void {
    google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response: { credential: string }) => {
        callback(response.credential);
      },
    });
  }

  renderButton(element: HTMLElement): void {
    google.accounts.id.renderButton(element, {
      type: 'standard',
      size: 'large',
      text: 'signup_with',
      shape: 'rectangular',
      locale: 'pt-BR',
    });
  }
  renderLoginButton(element: HTMLElement): void {
    google.accounts.id.renderButton(element, {
        type: 'standard',
        size: 'large',
        text: 'signin_with', // "Entrar com Google"
        shape: 'rectangular',
        locale: 'pt-BR',
    });
    }

  cancel(): void {
    google.accounts.id.cancel();
  }
}