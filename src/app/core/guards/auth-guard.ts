import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.resolveSession().pipe(
    map((user) => (user ? true : router.parseUrl('/login')))
  );
};
