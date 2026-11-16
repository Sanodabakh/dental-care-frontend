import { Component } from '@angular/core';
import {
  ModuleOverviewComponent,
  ModuleOverviewConfig,
} from '../../shared/components/module-overview/module-overview.component';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [ModuleOverviewComponent],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css'],
})
export class BillingComponent {
  readonly config: ModuleOverviewConfig = {
    title: 'Facturation',
    subtitle: 'Créez et suivez les factures des patients.',
    panelTitle: 'Factures',
    description: 'Les factures, leurs lignes de soins, règlements et soldes seront consultables ici.',
    nextSteps: ['Créer une facture patient', 'Suivre les factures en attente', 'Télécharger ou imprimer un reçu'],
  };
}
