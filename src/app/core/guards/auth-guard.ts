import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getMe().pipe(
    map(() => true),
    catchError(() => of(router.parseUrl('/login')))
  );
};
