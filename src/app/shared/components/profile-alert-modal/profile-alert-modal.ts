import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth-service';

type AlertVariant = 'completeProfile' | 'phone' | null;

@Component({
  selector: 'app-profile-alert-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-alert-modal.html',
})
export class ProfileAlertModal {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly variant = computed<AlertVariant>(() => {
    if (this.authService.showCompleteProfileModal()) return 'completeProfile';
    return null;
  });

  dismiss(variant: AlertVariant): void {
    if (variant === 'completeProfile') {
      this.authService.dismissProfileWarning();
    } 
  }

  goToProfile(variant: AlertVariant): void {
    void this.router.navigate([variant === 'completeProfile' ? '/complete-profile' : '/user-profile']);
  }
}
