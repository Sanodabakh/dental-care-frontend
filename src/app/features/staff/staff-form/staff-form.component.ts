import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideArrowLeft, LucideSave, LucideX } from '@lucide/angular';
import { StaffRole } from '../../../shared/models/staff.model';
import { StaffService } from '../staff.service';

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideArrowLeft, LucideSave, LucideX],
  templateUrl: './staff-form.component.html',
  styleUrls: ['./staff-form.component.css'],
})
export class StaffFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(StaffService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly roles: Array<{ value: StaffRole; label: string }> = [
    { value: 'ADMIN', label: 'Administrateur' },
    { value: 'DENTIST', label: 'Dentiste' },
    { value: 'SECRETARY', label: 'Secrétaire' },
    { value: 'CASHIER', label: 'Caissier' },
    { value: 'STOCK_MANAGER', label: 'Gestionnaire stock' },
    { value: 'ASSISTANT', label: 'Assistant' },
  ];

  readonly form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    role: ['ASSISTANT', [Validators.required]],
    specialty: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.service.create(this.form.value).subscribe({
      next: () => void this.router.navigate(['/staff']),
      error: error => {
        this.saving.set(false);
        this.error.set(error instanceof Error ? error.message : 'Impossible de créer le membre.');
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/staff']);
  }
}
