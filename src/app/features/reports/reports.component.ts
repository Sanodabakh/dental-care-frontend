import { Component } from '@angular/core';
import {
  ModuleOverviewComponent,
  ModuleOverviewConfig,
} from '../../shared/components/module-overview/module-overview.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [ModuleOverviewComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent {
  readonly config: ModuleOverviewConfig = {
    title: 'Rapports',
    subtitle: 'Consultez les indicateurs d’activité et exportez vos rapports.',
    panelTitle: 'Rapports d’activité',
    description: 'Les rapports pourront être filtrés par période, praticien et type d’activité.',
    nextSteps: ['Choisir une période d’analyse', 'Filtrer les résultats', 'Exporter un rapport'],
  };
}
