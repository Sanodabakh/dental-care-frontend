import { Component } from '@angular/core';
import {
  ModuleOverviewComponent,
  ModuleOverviewConfig,
} from '../../shared/components/module-overview/module-overview.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [ModuleOverviewComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent {
  readonly config: ModuleOverviewConfig = {
    title: 'Notifications',
    subtitle: 'Retrouvez les alertes et rappels liés à l’activité du cabinet.',
    panelTitle: 'Centre de notifications',
    description: 'Les rappels de rendez-vous et alertes de gestion seront centralisés dans cette boîte.',
    nextSteps: ['Consulter les nouvelles alertes', 'Marquer les notifications comme lues', 'Configurer les préférences de rappel'],
  };
}
