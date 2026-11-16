import { Routes } from '@angular/router';

export const CONSULTATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./consultation-form/consultation-form.component').then(
        (module) => module.ConsultationFormComponent,
      ),
  },
];
