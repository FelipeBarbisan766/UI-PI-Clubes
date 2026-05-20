import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { guestGuard } from './core/guards/guest-guard';
import { authGuard } from './core/guards/auth-guard';
import { SignUp } from './features/auth/pages/sign-up/sign-up';
import { adminGuard } from './core/guards/admin-guard';
import { selectRoleGuard } from './core/guards/selectRole-guard';
import { Clubs } from './features/admin/pages/clubs/clubs';

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
        path: 'clubs',
        loadComponent: () =>
          import('./features/clubs/clubs-list/clubs-list').then((m) => m.ClubsList),
      },
      {
        path: 'clubs/:clubId',
        loadComponent: () =>
          import('./features/clubs/clubs-details/clubs-details').then((m) => m.ClubsDetail),
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/pages/login/login').then((m) => m.Login),
      },
      {
        path: 'verify-mail',
        loadComponent: () =>
          import('./features/auth/pages/verify-mail/verify-mail').then((m) => m.VerifyMail),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password').then((m) => m.ForgotPassword),
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
    path: 'admin/clubs',
    canActivate: [adminGuard],
    component: Clubs, 
  },
    {
    path: 'admin/club/:clubId',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'courts',
        loadComponent: () =>
          import('./features/admin/pages/courts/courts').then((m) => m.Courts),
      },
      {
        path: 'court/:courtId',
        children: [
          {
            path: 'schedule',
            loadComponent: () =>
              import('./features/admin/pages/schedules/schedules').then((m) => m.Schedules),
          }
        ]
      }
    ],
  },

  {
    path: 'sign-up',
    canActivate: [guestGuard],
    component: SignUp,
  },
  {
    path: 'select',
    canActivate: [selectRoleGuard],
    loadComponent: () =>
      import('./features/auth/pages/select-role/select-role').then((m) => m.SelectRole),
  },
  // {
  //   path: '**',
  //   redirectTo: '',
  // },
];