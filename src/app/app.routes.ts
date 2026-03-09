import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { Navbar } from './shared/navbar/navbar';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Clubs } from './pages/clubs/clubs';

export const routes: Routes = [
    {
        path: '',
        component: MainLayout,
        children: [
            {
                path: '',
                component: HomePage,
            },
            {
                path: 'clubs',
                component: Clubs,
            }
        ]
    }
];
