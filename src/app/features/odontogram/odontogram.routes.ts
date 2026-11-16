import { Routes } from '@angular/router';

export const ODONTOGRAM_ROUTES: Routes = [
  {
    path: ':patientId',
    loadComponent: () =>
      import('./odontogram.component').then((module) => module.OdontogramComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./odontogram.component').then((module) => module.OdontogramComponent),
  },
];
