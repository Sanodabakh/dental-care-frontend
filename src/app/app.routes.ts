import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () =>
      import('./features/landing/landing.routes').then(module => module.LANDING_ROUTES),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((module) => module.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/shell/shell.component').then((module) => module.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (module) => module.DashboardComponent,
          ),
      },
      {
        path: 'patients',
        loadChildren: () =>
          import('./features/patients/patients.routes').then((module) => module.PATIENTS_ROUTES),
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./features/appointments/appointments.routes').then(
            (module) => module.APPOINTMENTS_ROUTES,
          ),
      },
      {
        path: 'treatments',
        loadChildren: () =>
          import('./features/treatments/treatments.routes').then(
            (module) => module.TREATMENTS_ROUTES,
          ),
      },
      {
        path: 'staff',
        loadChildren: () =>
          import('./features/staff/staff.routes').then((module) => module.STAFF_ROUTES),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then(
            (module) => module.SETTINGS_ROUTES,
          ),
      },
      {
        path: 'cash-register',
        loadChildren: () =>
          import('./features/cash-register/cash-register.routes').then(
            (module) => module.CASH_ROUTES,
          ),
      },
      {
        path: 'inventory',
        loadChildren: () =>
          import('./features/inventory/inventory.routes').then(
            (module) => module.INVENTORY_ROUTES,
          ),
      },
      {
        path: 'finance',
        loadChildren: () =>
          import('./features/finance/finance.routes').then(
            (module) => module.FINANCE_ROUTES,
          ),
      },
      {
        path: 'billing',
        loadChildren: () =>
          import('./features/billing/billing.routes').then(
            (module) => module.BILLING_ROUTES,
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reports/reports.routes').then(
            (module) => module.REPORTS_ROUTES,
          ),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./features/notifications/notifications.routes').then(
            (module) => module.NOTIFICATIONS_ROUTES,
          ),
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('./features/payments/payments.routes').then(
            (module) => module.PAYMENTS_ROUTES,
          ),
      },
      {
        path: 'consultations',
        loadChildren: () =>
          import('./features/consultations/consultations.routes').then(
            (module) => module.CONSULTATIONS_ROUTES,
          ),
      },
      {
        path: 'odontograms',
        loadChildren: () =>
          import('./features/odontogram/odontogram.routes').then(
            (module) => module.ODONTOGRAM_ROUTES,
          ),
      },
      {
        path: 'odontogram',
        pathMatch: 'full',
        redirectTo: 'odontograms',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
