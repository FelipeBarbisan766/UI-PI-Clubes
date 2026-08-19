import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const completeProfileGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.resolveSession().pipe(
    map((user) => {
      if (!user) return router.createUrlTree(['/login']);
      if (user.role === 'Player') return router.createUrlTree(['/clubs']);
      return true;
    }),
  );
};