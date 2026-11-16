import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./stock-form/stock-form.component').then(module => module.StockFormComponent),
  },
  {
    path: 'movement',
    loadComponent: () =>
      import('./stock-movement/stock-movement.component').then(module => module.StockMovementComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./stock-form/stock-form.component').then(module => module.StockFormComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./stock-list/stock-list.component').then(module => module.StockListComponent),
  },
];
