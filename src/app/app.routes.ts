import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { SearchHome } from './shared/components/search-home/search-home';
import { guestGuard } from './core/guards/guest-guard';
import { authGuard } from './core/guards/auth-guard';
import { Dashboard } from './features/admin/pages/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home-page/home-page').then((m) => m.HomePage),
      },
      {
        path: 'clubs-list',
        loadComponent: () =>
          import('./features/clubs/clubs-list/clubs-list').then((m) => m.ClubsList),
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/login/login').then((m) => m.Login),
      },
      {
        path: 'sign-up',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/sign-up/sign-up').then((m) => m.SignUp),
      },
      {
        path: 'verify-mail',
        loadComponent: () =>
          import('./features/auth/pages/verify-mail/verify-mail').then((m) => m.VerifyMail),
      },
      {
        path: 'player-form',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/auth/pages/form-roles/player-form/player-form').then((m) => m.PlayerForm),
      },
      {
        path: 'admin-form',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/auth/pages/form-roles/admin-form/admin-form').then((m) => m.AdminForm),
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => 
          import('./features/admin/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'quadras',
        loadComponent: () => 
          import('./features/admin/pages/quadras/quadras').then((m) => m.Quadras),
      }
    ],
  },
  {
    path: 'select',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/pages/select-role/select-role').then((m) => m.SelectRole),
  },
  {
    path: '**',
    redirectTo: '',
  },
];