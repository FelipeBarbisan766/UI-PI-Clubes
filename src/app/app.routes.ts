import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { guestGuard } from './core/guards/guest-guard';
import { authGuard } from './core/guards/auth-guard';
import { SignUp } from './features/auth/pages/sign-up/sign-up';
import { adminGuard } from './core/guards/admin-guard';
import { selectRoleGuard } from './core/guards/selectRole-guard';
import { Clubs } from './features/admin/pages/clubs/clubs';
import { clubNameResolver } from './shared/components/resolvers/club-name.resolver';
import { courtNameResolver } from './shared/components/resolvers/court-name.resolver';
import { clubCityResolver } from './shared/components/resolvers/club-city.resolver';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home-page/home-page').then((m) => m.HomePage),
      },
      {
        path: 'clubs',
        loadComponent: () =>
          import('./features/clubs/clubs-list/clubs-list').then((m) => m.ClubsList),
      },
      {
        path: 'courts',
        loadComponent: () =>
          import('./features/clubs/courts-list/courts-list').then((m) => m.CourtsList),
      },
      {
        path: 'clubs/:clubId',
        loadComponent: () =>
          import('./features/clubs/clubs-details/clubs-details').then((m) => m.ClubsDetail),
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
      },
      {
        path: 'verify-mail',
        loadComponent: () =>
          import('./features/auth/pages/verify-mail/verify-mail').then((m) => m.VerifyMail),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password').then(
            (m) => m.ForgotPassword,
          ),
      },
      // {
      //   path: 'player-form',
      //   canActivate: [authGuard],
      //   loadComponent: () =>
      //     import('./features/auth/pages/form-roles/player-form/player-form').then((m) => m.PlayerForm),
      // },
      // {
      //   path: 'admin-form',
      //   canActivate: [authGuard],
      //   loadComponent: () =>
      //     import('./features/auth/pages/form-roles/admin-form/admin-form').then((m) => m.AdminForm),
      // },
      {
        path: 'plans',
        loadComponent: () => import('./features/admin/pages/plans/plans').then((m) => m.Plans),
      },
      {
        path: 'payment',
        loadComponent: () =>
          import('./features/admin/pages/payment/payment').then((m) => m.Payment),
        data: { paymentStep: 'select-method' },
      },
      {
        path: 'payment/success',
        loadComponent: () =>
          import('./features/admin/pages/payment/payment').then((m) => m.Payment),
        data: { paymentStep: 'success' },
      },
      {
        path: 'payment/failure',
        loadComponent: () =>
          import('./features/admin/pages/payment/payment').then((m) => m.Payment),
        data: { paymentStep: 'failure' },
      },
      {
        path: 'payment/pending',
        loadComponent: () =>
          import('./features/admin/pages/payment/payment').then((m) => m.Payment),
        data: { paymentStep: 'pending' },
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./features/admin/pages/subscriptions/subscriptions').then((m) => m.Subscriptions),
      },
      {
        path: 'user-profile',
        loadComponent: () =>
          import('./features/user/user-profile/user-profile').then((m) => m.UserProfile),
      },
      {
        path: 'user-reserves',
        loadComponent: () =>
          import('./features/user/user-reserves/user-reserves').then((m) => m.UserReserve),
      },
      {
        path: 'admin/clubs',
        canActivate: [adminGuard],
        component: Clubs,
      },
      {
        path: 'admin/club/:clubId',
        resolve: {
          clubName: clubNameResolver,
          clubCity: clubCityResolver,
        },
        component: AdminLayout,
        canActivate: [adminGuard],
        children: [
          {
            path: 'dashboard',
            data: { breadcrumb: 'Dashboard' },
            loadComponent: () =>
              import('./features/admin/pages/dashboard/dashboard').then((m) => m.Dashboard),
          },
          {
            path: 'courts',
            data: { breadcrumb: 'Quadras' },
            loadComponent: () =>
              import('./features/admin/pages/courts/courts').then((m) => m.Courts),
          },
          {
            path: 'court/:courtId',
            resolve: { dynamicBreadcrumb: courtNameResolver },
            children: [
              {
                path: 'schedule',
                data: { breadcrumb: 'Horario' },
                loadComponent: () =>
                  import('./features/admin/pages/schedules/schedules').then((m) => m.Schedules),
              },
            ],
          },
          {
            path: 'reserves',
            data: { breadcrumb: 'Reservas' },
            loadComponent: () =>
              import('./features/admin/pages/reserves/reserves').then((m) => m.Reserve),
          },
          {
            path: 'config',
            data: { breadcrumb: 'Configurações' },
            loadComponent: () =>
              import('./features/admin/pages/config-club/config-club').then((m) => m.ConfigClub),
          },
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
    ],
  },
];
