import { Routes } from '@angular/router';
import { HomePage } from './features/home-page/home-page';
import { MainLayout } from './layout/main-layout/main-layout';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { SearchHome } from './shared/components/search-home/search-home';
import { Login } from './features/auth/pages/login/login';
import { SignUp } from './features/auth/pages/sign-up/sign-up';
import { ClubsList } from './features/clubs/clubs-list/clubs-list';
import { SelectRole } from './features/auth/pages/select-role/select-role';
import { AdminForm } from './features/auth/pages/form-roles/admin-form/admin-form';
import { PlayerForm } from './features/auth/pages/form-roles/player-form/player-form';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home-page/home-page').then(() => HomePage),
      },
      {
        path: 'clubs-list',
        loadComponent: () => import('./features/clubs/clubs-list/clubs-list').then(() => ClubsList),
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login/login').then(() => Login),
      },
      {
        path: 'sign-up',
        loadComponent: () => import('./features/auth/pages/sign-up/sign-up').then(() => SignUp),
      },
      {
        path: 'player-form',
        loadComponent: () => import('./features/auth/pages/form-roles/player-form/player-form').then(() => PlayerForm),
      },
      {
        path: 'admin-form',
        loadComponent: () => import('./features/auth/pages/form-roles/admin-form/admin-form').then(() => AdminForm),
      }
    ],
  },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      {
        path: 'teste',
        component: SearchHome,
      },
    ],
  },
  {
    path: 'select',
    component: SelectRole,
  }
];
