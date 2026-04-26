import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { map } from 'rxjs/operators';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.resolveSession().pipe(
    map((user) => (user ? router.parseUrl('/select') : true))
  );
};