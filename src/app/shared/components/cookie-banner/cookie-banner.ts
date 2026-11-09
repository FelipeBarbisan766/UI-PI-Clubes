import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CookieConsentService } from './service/cookie-consent';

@Component({
  selector: 'app-cookie-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cookie-banner.html',
})
export class CookieBanner {
  protected readonly consent = inject(CookieConsentService);
}