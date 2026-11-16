import { Component } from '@angular/core';
import {
  ModuleOverviewComponent,
  ModuleOverviewConfig,
} from '../../shared/components/module-overview/module-overview.component';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [ModuleOverviewComponent],
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.css'],
})
export class StaffComponent {
  readonly config: ModuleOverviewConfig = {
    title: 'Personnel',
    subtitle: 'Consultez et administrez les membres de l’équipe du cabinet.',
    panelTitle: 'Équipe du cabinet',
    description: 'Les comptes, rôles et disponibilités du personnel seront gérés dans cet espace.',
    nextSteps: ['Ajouter un membre du personnel', 'Attribuer les rôles et accès', 'Gérer les disponibilités'],
  };
}
