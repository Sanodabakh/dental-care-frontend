import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideArrowLeft, LucideSave, LucideX } from '@lucide/angular';
import { ProductService } from '../services/product.service';
import { Product } from '../../../shared/models/product.model';

@Component({
  selector: 'app-stock-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideArrowLeft, LucideSave, LucideX],
  templateUrl: './stock-form.component.html',
  styleUrls: ['./stock-form.component.css'],
})
export class StockFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEdit = signal(false);
  readonly product = signal<Product | null>(null);
  readonly categories = ['Protection', 'Médicaments', 'Restauration', 'Instruments', 'Hygiène'];

  readonly form: FormGroup = this.fb.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    minQuantity: [5, [Validators.required, Validators.min(0)]],
    purchasePriceFcfa: [0, [Validators.required, Validators.min(0)]],
    supplier: [''],
    expirationDate: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isEdit.set(true);
    this.service.getById(id).subscribe({
      next: product => {
        if (!product) {
          void this.router.navigate(['/inventory']);
          return;
        }
        this.product.set(product);
        this.form.patchValue({
          code: product.code,
          name: product.name,
          category: product.category,
          quantity: product.quantity,
          minQuantity: product.minQuantity,
          purchasePriceFcfa: product.purchasePriceFcfa,
          supplier: product.supplier ?? '',
          expirationDate: product.expirationDate ?? '',
        });
      },
      error: error => this.error.set(
        error instanceof Error ? error.message : 'Impossible de charger le produit.',
      ),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const existing = this.product();
    if (this.isEdit() && !existing) {
      this.saving.set(false);
      this.error.set('Le produit est encore en cours de chargement.');
      return;
    }
    const operation = existing
      ? this.service.update(existing.id, this.form.value)
      : this.service.create(this.form.value);

    operation.subscribe({
      next: () => void this.router.navigate(['/inventory']),
      error: error => {
        this.saving.set(false);
        this.error.set(error instanceof Error ? error.message : 'Impossible d’enregistrer le produit.');
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/inventory']);
  }
}
