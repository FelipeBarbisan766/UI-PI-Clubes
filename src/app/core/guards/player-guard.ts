import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { map } from 'rxjs/operators';

const normalizeRole = (role: string | null | undefined): string =>
  (role ?? '').trim().toLowerCase();

export const playerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.resolveSession().pipe(
    map((user) => {
      if (!user) {
        return router.parseUrl('/login');
      }

      const role = normalizeRole(user.role);

      return role === 'player' || role === 'both'
        ? true
        : router.parseUrl('/select');
    })
  );
};