import { Routes } from '@angular/router';

export const CASH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./cash-register.component').then(module => module.CashRegisterComponent),
  },
];
