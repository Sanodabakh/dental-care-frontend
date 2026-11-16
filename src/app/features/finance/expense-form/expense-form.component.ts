import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideArrowLeft, LucideSave, LucideX } from '@lucide/angular';
import { ExpenseService } from '../expense.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideArrowLeft, LucideSave, LucideX],
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.css'],
})
export class ExpenseFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ExpenseService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly categories = [
    'Loyer', 'Salaires', 'Fournitures', 'Électricité', 'Eau',
    'Internet', 'Maintenance', 'Marketing', 'Autres',
  ];
  readonly paymentMethods = ['ESPECES', 'WAVE', 'ORANGE_MONEY', 'VIREMENT', 'CARTE'];

  readonly form: FormGroup = this.fb.group({
    category: ['', [Validators.required]],
    label: ['', [Validators.required, Validators.minLength(3)]],
    amountFcfa: [0, [Validators.required, Validators.min(1)]],
    expenseDate: [new Date().toISOString().slice(0, 10), [Validators.required]],
    paymentMethod: ['VIREMENT', [Validators.required]],
    reference: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.service.create(this.form.value).subscribe({
      next: () => void this.router.navigate(['/finance']),
      error: error => {
        this.saving.set(false);
        this.error.set(error instanceof Error ? error.message : 'Impossible d’enregistrer la dépense.');
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/finance']);
  }
}
