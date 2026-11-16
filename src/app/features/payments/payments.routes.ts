import { Routes } from '@angular/router';

export const PAYMENTS_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./payment-form/payment-form.component').then(module => module.PaymentFormComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./payment-list/payment-list.component').then(module => module.PaymentListComponent),
  },
];
