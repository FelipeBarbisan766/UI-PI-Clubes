import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { map } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.resolveSession().pipe(
    map((user) => {
      if (!user) {
        return router.parseUrl('/login');
      }

      return user.role?.toLowerCase() === 'admin'
        ? true
        : router.parseUrl('/select');
    })
  );
};