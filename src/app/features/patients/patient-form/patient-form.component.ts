import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideArrowLeft as ArrowLeft,
  LucideSave as Save,
  LucideUserPlus as UserPlus,
  LucideX as X,
} from '@lucide/angular';
import { PatientService } from '../patient.service';
import { Patient } from '../../../shared/models/patient.model';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideIconComponent],
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.css'],
})
export class PatientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly icons = { ArrowLeft, Save, UserPlus, X };

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly patient = signal<Patient | null>(null);
  readonly isEdit = signal(false);

  readonly form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    birthDate: [''],
    gender: [''],
    phone: ['', [Validators.pattern(/^[0-9\s+\-()]{6,20}$/)]],
    secondaryPhone: [''],
    email: ['', [Validators.email]],
    address: [''],
    emergencyContact: [''],
    emergencyPhone: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.patientService.getById(id).subscribe(p => {
        if (!p) {
          this.router.navigate(['/patients']);
          return;
        }
        this.patient.set(p);
        this.form.patchValue({
          firstName: p.firstName,
          lastName: p.lastName,
          birthDate: p.birthDate ?? '',
          gender: p.gender ?? '',
          phone: p.phone ?? '',
          secondaryPhone: p.secondaryPhone ?? '',
          email: p.email ?? '',
          address: p.address ?? '',
          emergencyContact: p.emergencyContact ?? '',
          emergencyPhone: p.emergencyPhone ?? '',
        });
        this.loading.set(false);
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const dto = this.form.value;

    if (this.isEdit() && this.patient()) {
      this.patientService.update(this.patient()!.id, dto).subscribe({
        next: p => this.router.navigate(['/patients', p.id]),
        error: () => {
          this.saving.set(false);
          this.error.set('Erreur lors de la mise à jour');
        },
      });
    } else {
      this.patientService.create(dto).subscribe({
        next: p => this.router.navigate(['/patients', p.id]),
        error: () => {
          this.saving.set(false);
          this.error.set('Erreur lors de la création');
        },
      });
    }
  }

  cancel(): void {
    if (this.isEdit() && this.patient()) {
      this.router.navigate(['/patients', this.patient()!.id]);
    } else {
      this.router.navigate(['/patients']);
    }
  }

  fieldError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.errors?.['required']) return 'Ce champ est requis';
    if (ctrl.errors?.['minlength']) return `Minimum ${ctrl.errors['minlength'].requiredLength} caractères`;
    if (ctrl.errors?.['email']) return 'Adresse e-mail invalide';
    if (ctrl.errors?.['pattern']) return 'Format invalide';
    return 'Champ invalide';
  }
}