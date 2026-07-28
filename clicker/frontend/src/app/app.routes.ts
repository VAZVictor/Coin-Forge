import { Routes } from '@angular/router';
import { Login } from './login/login';

export const routes: Routes = [
    { path: "login", component: Login },
    //{ path: "clicker", component:  }
    { path: "", component: Login }
];
