import { Component } from '@angular/core';
import {
  ModuleOverviewComponent,
  ModuleOverviewConfig,
} from '../../shared/components/module-overview/module-overview.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [ModuleOverviewComponent],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css'],
})
export class PaymentsComponent {
  readonly config: ModuleOverviewConfig = {
    title: 'Paiements & caisse',
    subtitle: 'Enregistrez les règlements et suivez les soldes des factures.',
    panelTitle: 'Suivi des paiements',
    description: 'Les paiements par espèces, carte, virement et mobile money seront répertoriés ici.',
    nextSteps: ['Enregistrer un règlement', 'Associer un paiement à une facture', 'Consulter les paiements par mode'],
  };
}
