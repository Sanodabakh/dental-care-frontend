import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideAlertTriangle,
  LucideArrowDown,
  LucideArrowUp,
  LucideEdit,
  LucideFilter,
  LucidePlus,
  LucideSearch,
} from '@lucide/angular';
import { ProductService } from '../services/product.service';
import { Product } from '../../../shared/models/product.model';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, FcfaPipe,
    LucideSearch, LucidePlus, LucideEdit, LucideArrowUp, LucideArrowDown,
    LucideFilter, LucideAlertTriangle,
  ],
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.css'],
})
export class StockListComponent implements OnInit {
  private readonly service = inject(ProductService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly products = signal<Product[]>([]);
  readonly search = signal('');
  readonly category = signal('ALL');
  readonly categories = ['Protection', 'Médicaments', 'Restauration', 'Instruments', 'Hygiène'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.list({ search: this.search(), category: this.category() }).subscribe({
      next: products => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible de charger le stock.');
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.load();
  }

  onCategory(value: string): void {
    this.category.set(value);
    this.load();
  }

  statusLabel(product: Product): string {
    const labels = { OK: 'OK', ALERTE: 'Stock bas', RUPTURE: 'Rupture', PERIME: 'Périmé' };
    return labels[this.service.getStatus(product)];
  }

  statusClass(product: Product): string {
    const classes = {
      OK: 'dc-badge-success',
      ALERTE: 'dc-badge-warning',
      RUPTURE: 'dc-badge-danger',
      PERIME: 'dc-badge-danger',
    };
    return classes[this.service.getStatus(product)];
  }

  isAlert(product: Product): boolean {
    return this.service.getStatus(product) !== 'OK';
  }

  alertsCount(): number {
    return this.products().filter(product => this.isAlert(product)).length;
  }
}
