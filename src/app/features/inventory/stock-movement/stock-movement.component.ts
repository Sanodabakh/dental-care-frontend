import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowDown,
  LucideArrowLeft,
  LucideArrowUp,
  LucideSave,
  LucideX,
} from '@lucide/angular';
import { ProductService } from '../services/product.service';
import { Product } from '../../../shared/models/product.model';

type MovementType = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';

@Component({
  selector: 'app-stock-movement',
  standalone: true,
  imports: [
    FormsModule, RouterLink,
    LucideArrowLeft, LucideArrowUp, LucideArrowDown, LucideSave, LucideX,
  ],
  templateUrl: './stock-movement.component.html',
  styleUrls: ['./stock-movement.component.css'],
})
export class StockMovementComponent implements OnInit {
  private readonly service = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly product = signal<Product | null>(null);
  readonly type = signal<MovementType>('ENTREE');
  readonly quantity = signal(1);
  readonly reason = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  ngOnInit(): void {
    const type = this.route.snapshot.queryParamMap.get('type');
    if (type === 'ENTREE' || type === 'SORTIE' || type === 'AJUSTEMENT') {
      this.type.set(type);
    }

    const productId = this.route.snapshot.queryParamMap.get('productId');
    if (!productId) {
      this.loading.set(false);
      this.error.set('Sélectionnez un produit pour enregistrer son mouvement.');
      return;
    }

    this.service.getById(productId).subscribe({
      next: product => {
        this.product.set(product ?? null);
        if (!product) this.error.set('Produit introuvable.');
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible de charger le produit.');
        this.loading.set(false);
      },
    });
  }

  setType(type: MovementType): void {
    this.type.set(type);
    this.quantity.set(type === 'AJUSTEMENT' ? (this.product()?.quantity ?? 0) : 1);
    this.error.set(null);
  }

  updateQuantity(value: number): void {
    this.quantity.set(Number.isFinite(value) && value >= 0 ? value : 0);
  }

  save(): void {
    const product = this.product();
    if (!product) {
      this.error.set('Sélectionnez un produit.');
      return;
    }
    if (!Number.isFinite(this.quantity()) ||
      this.quantity() < 0 ||
      (this.type() !== 'AJUSTEMENT' && this.quantity() === 0)) {
      this.error.set(this.type() === 'AJUSTEMENT'
        ? 'La quantité cible doit être positive ou nulle.'
        : 'La quantité doit être supérieure à zéro.');
      return;
    }
    if (this.type() === 'SORTIE' && this.quantity() > product.quantity) {
      this.error.set(`Quantité insuffisante (stock actuel : ${product.quantity}).`);
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.service.addMovement({
      productId: product.id,
      type: this.type(),
      quantity: this.quantity(),
      reason: this.reason().trim() || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
      },
      error: error => {
        this.saving.set(false);
        this.error.set(error instanceof Error ? error.message : 'Impossible d’enregistrer le mouvement.');
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/inventory']);
  }
}
