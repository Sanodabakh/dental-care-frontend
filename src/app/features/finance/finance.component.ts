import { Component } from '@angular/core';
import {
  ModuleOverviewComponent,
  ModuleOverviewConfig,
} from '../../shared/components/module-overview/module-overview.component';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [ModuleOverviewComponent],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.css'],
})
export class FinanceComponent {
  readonly config: ModuleOverviewConfig = {
    title: 'Finances',
    subtitle: 'Analysez les recettes et les indicateurs financiers du cabinet.',
    panelTitle: 'Vue financière',
    description: 'Les recettes, dépenses et tendances seront calculées à partir des opérations enregistrées.',
    nextSteps: ['Consulter les recettes par période', 'Suivre les dépenses du cabinet', 'Comparer les indicateurs financiers'],
  };
}
