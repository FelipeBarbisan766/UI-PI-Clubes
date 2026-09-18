import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthRequiredModalService } from './auth-required-modal-service';

@Component({
  selector: 'app-auth-required-modal',
  imports: [],
  templateUrl: './auth-required-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthRequiredModal {
  private readonly router = inject(Router);
  protected readonly modalService = inject(AuthRequiredModalService);

  goToLogin(): void {
    const returnUrl = this.modalService.returnUrl() ?? this.router.url;
    this.modalService.hide();
    this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }

  close(): void {
    this.modalService.hide();
  }
}