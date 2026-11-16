import { inject } from '@angular/core';
import { CanActivateFn, Routes, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

const landingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).parseUrl('/dashboard') : true;
};

export const LANDING_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [landingGuard],
    loadComponent: () =>
      import('./landing.component').then(module => module.LandingComponent),
  },
];
