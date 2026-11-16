import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./appointment-form/appointment-form.component').then(m => m.AppointmentFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./appointment-form/appointment-form.component').then(m => m.AppointmentFormComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./calendar/calendar.component').then(m => m.CalendarComponent),
  },
];