import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth-service';
import { take } from 'rxjs';

@Component({
  selector: 'app-select-role',
  imports: [],
  templateUrl: './select-role.html',
  styleUrl: './select-role.css',
})
export class SelectRole {

  private router = inject(Router);
  private authService = inject(AuthService);

  goToPlayerForm(){
    this.router.navigate(['/player-form'])
  }

  goToAdminForm(){
    this.router.navigate(['/admin-form'])
  }

  onLogout(): void {
  this.authService.logout().pipe(take(1)).subscribe({
    next: () => void this.router.navigateByUrl('/login'),
    error: () => void this.router.navigateByUrl('/login'),
  });
}
}
