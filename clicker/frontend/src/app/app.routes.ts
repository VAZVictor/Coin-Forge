import { Routes } from '@angular/router';
import { Login } from './login/login';
import { GameLayout } from './game-layout/game-layout';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'clicker', component: GameLayout, canActivate: [authGuard] },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];
