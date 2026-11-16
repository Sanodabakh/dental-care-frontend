import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./invoice-form/invoice-form.component').then(module => module.InvoiceFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./invoice-detail/invoice-detail.component').then(module => module.InvoiceDetailComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./invoice-list/invoice-list.component').then(module => module.InvoiceListComponent),
  },
];
