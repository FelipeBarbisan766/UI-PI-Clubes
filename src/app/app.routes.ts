import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { SearchHome } from './shared/components/search-home/search-home';
import { Login } from './pages/login/login';
import { SignUp } from './pages/register/sign-up/sign-up';
import { ClubsList } from './pages/clubs/clubs-list/clubs-list';
import { SelectRole } from './pages/select-role/select-role';
import { AdminForm } from './pages/form-roles/admin-form/admin-form';
import { PlayerForm } from './pages/form-roles/player-form/player-form';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home-page/home-page').then((m) => HomePage),
      },
      {
        path: 'clubs-list',
        loadComponent: () => import('./pages/clubs/clubs-list/clubs-list').then((m) => ClubsList),
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(() => Login),
      },
      {
        path: 'sign-up',
        loadComponent: () => import('./pages/register/sign-up/sign-up').then(() => SignUp),
      },
      {
        path: 'player-form',
        loadComponent: () => import('./pages/form-roles/player-form/player-form').then(() => PlayerForm),
      },
      {
        path: 'admin-form',
        loadComponent: () => import('./pages/form-roles/admin-form/admin-form').then(() => AdminForm),
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
