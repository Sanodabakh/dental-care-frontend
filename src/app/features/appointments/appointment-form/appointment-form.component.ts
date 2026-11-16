import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAlertTriangle as AlertTriangle,
  LucideArrowLeft as ArrowLeft,
  LucideSave as Save,
  LucideX as X,
} from '@lucide/angular';
import { AppointmentService } from '../appointment.service';
import { PatientService } from '../../patients/patient.service';
import { Appointment } from '../../../shared/models/appointment.model';
import { Patient } from '../../../shared/models/patient.model';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideIconComponent],
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css'],
})
export class AppointmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly appointmentService = inject(AppointmentService);
  private readonly patientService = inject(PatientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly icons = { ArrowLeft, Save, AlertTriangle, X };

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly conflictError = signal<string | null>(null);
  readonly appointment = signal<Appointment | null>(null);
  readonly isEdit = signal(false);
  readonly patients = signal<Patient[]>([]);

  readonly dentists = [
    { id: 'd1', name: 'Dr. Omar Fall' },
    { id: 'd2', name: 'Dr. Mamadou Diop' },
  ];

  readonly form: FormGroup = this.fb.group({
    patientId: ['', [Validators.required]],
    dentistId: ['d1', [Validators.required]],
    date: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    motif: ['', [Validators.required, Validators.minLength(3)]],
    observation: [''],
  }, { validators: this.endAfterStartValidator });

  ngOnInit(): void {
    this.patientService.list({ page: 0, size: 100 }).subscribe(res => {
      this.patients.set(res.items);
    });

    const id = this.route.snapshot.paramMap.get('id');
    const patientId = this.route.snapshot.queryParamMap.get('patientId');

    if (id) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.appointmentService.getById(id).subscribe(a => {
        if (!a) { this.router.navigate(['/appointments']); return; }
        this.appointment.set(a);
        const start = new Date(a.startTime);
        const end = new Date(a.endTime);
        this.form.patchValue({
          patientId: a.patientId,
          dentistId: a.dentistId,
          date: start.toISOString().slice(0, 10),
          startTime: start.toTimeString().slice(0, 5),
          endTime: end.toTimeString().slice(0, 5),
          motif: a.motif,
          observation: a.observation ?? '',
        });
        this.loading.set(false);
      });
    } else if (patientId) {
      this.form.patchValue({ patientId });
    }
  }

  // Validator: end > start
  endAfterStartValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startTime')?.value;
    const end = control.get('endTime')?.value;
    if (!start || !end) return null;
    return start < end ? null : { endBeforeStart: true };
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const startISO = `${v.date}T${v.startTime}:00`;
    const endISO = `${v.date}T${v.endTime}:00`;

    // Vérification conflit
    this.appointmentService.checkConflict(
      v.dentistId, startISO, endISO, this.appointment()?.id,
    ).subscribe(hasConflict => {
      if (hasConflict) {
        this.conflictError.set('Ce créneau chevauche un autre rendez-vous pour ce dentiste.');
        return;
      }

      this.conflictError.set(null);
      this.saving.set(true);
      this.error.set(null);

      if (this.isEdit() && this.appointment()) {
        this.appointmentService.update(this.appointment()!.id, {
          patientId: v.patientId,
          dentistId: v.dentistId,
          startTime: startISO,
          endTime: endISO,
          motif: v.motif,
          observation: v.observation,
        }).subscribe({
          next: () => this.router.navigate(['/appointments']),
          error: (e: Error) => {
            this.saving.set(false);
            this.error.set(e.message);
          },
        });
      } else {
        this.appointmentService.create({
          patientId: v.patientId,
          dentistId: v.dentistId,
          startTime: startISO,
          endTime: endISO,
          motif: v.motif,
          observation: v.observation,
        }).subscribe({
          next: () => this.router.navigate(['/appointments']),
          error: (e: Error) => {
            this.saving.set(false);
            this.error.set(e.message);
          },
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/appointments']);
  }

  fieldError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.errors?.['required']) return 'Ce champ est requis';
    if (ctrl.errors?.['minlength']) return `Minimum ${ctrl.errors['minlength'].requiredLength} caractères`;
    return 'Champ invalide';
  }
}