import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { Navbar } from './shared/navbar/navbar';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Clubs } from './pages/clubs/clubs';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { SearchHome } from './shared/components/search-home/search-home';
import { Login } from './login/login';

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
        path: 'clubs',
        loadComponent: () => import('./pages/clubs/clubs').then((m) => Clubs),
      },
      {
        path: 'login',
        loadComponent: () => import('.//login/login').then(() => Login),
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
    path: 'login',
    component: Login,
  },
];
