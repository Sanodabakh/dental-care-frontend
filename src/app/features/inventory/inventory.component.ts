import { Component } from '@angular/core';
import {
  ModuleOverviewComponent,
  ModuleOverviewConfig,
} from '../../shared/components/module-overview/module-overview.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [ModuleOverviewComponent],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css'],
})
export class InventoryComponent {
  readonly config: ModuleOverviewConfig = {
    title: 'Stocks',
    subtitle: 'Surveillez les produits et consommables du cabinet.',
    panelTitle: 'Inventaire',
    description: 'Les quantités disponibles, seuils d’alerte et mouvements de stock seront suivis ici.',
    nextSteps: ['Ajouter des produits et consommables', 'Définir les seuils de réapprovisionnement', 'Enregistrer les entrées et sorties'],
  };
}
