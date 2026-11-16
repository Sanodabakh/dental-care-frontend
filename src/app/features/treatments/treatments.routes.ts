import { Routes } from '@angular/router';

export const TREATMENTS_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./treatment-form/treatment-form.component').then(
        module => module.TreatmentFormComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./treatment-form/treatment-form.component').then(
        module => module.TreatmentFormComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./treatments.component').then(module => module.TreatmentListComponent),
  },
];
