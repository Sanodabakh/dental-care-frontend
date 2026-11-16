import { Routes } from '@angular/router';

export const STAFF_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./staff-form/staff-form.component').then(module => module.StaffFormComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./staff-list/staff-list.component').then(module => module.StaffListComponent),
  },
];
