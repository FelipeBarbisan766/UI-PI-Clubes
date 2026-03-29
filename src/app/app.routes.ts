import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { SearchHome } from './shared/components/search-home/search-home';
import { Login } from './login/login';
import { SignUp } from './pages/register/sign-up/sign-up';
import { ClubsList } from './pages/clubs/clubs-list/clubs-list';

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
        loadComponent: () => import('./login/login').then(() => Login),
      },
      {
        path: 'sign-up',
        loadComponent: () => import('./pages/register/sign-up/sign-up').then(() => SignUp),
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
  }
];
