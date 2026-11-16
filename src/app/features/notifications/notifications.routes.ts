import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./notification-list/notification-list.component').then(
        module => module.NotificationListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./notification-form/notification-form.component').then(
        module => module.NotificationFormComponent,
      ),
  },
];
