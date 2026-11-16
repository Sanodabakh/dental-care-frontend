import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
  {
    path: 'expenses/new',
    loadComponent: () =>
      import('./expense-form/expense-form.component').then(module => module.ExpenseFormComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./finance-dashboard/finance-dashboard.component').then(module => module.FinanceDashboardComponent),
  },
];
