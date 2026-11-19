import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
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
import { User } from '../../../shared/models/user.model';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideIconComponent],
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
  readonly dentists = signal<User[]>([]);

  readonly referenceInput = signal('');
  readonly referencePatient = signal<Patient | null>(null);
  readonly referenceError = signal<string | null>(null);
  readonly searchingReference = signal(false);

  private allPatients: Patient[] = [];
  private bookedPatientIds = new Set<string>();
  private currentPatientId: string | null = null;

  readonly form: FormGroup = this.fb.group({
    patientId: ['', [Validators.required]],
    dentistId: ['', [Validators.required]],
    date: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    motif: ['', [Validators.required, Validators.minLength(3)]],
    observation: [''],
  }, { validators: this.endAfterStartValidator });

  ngOnInit(): void {
    this.loadSelectablePatients();

    this.appointmentService.dentists().subscribe(dentists => {
      this.dentists.set(dentists);
      if (!this.route.snapshot.paramMap.get('id') && dentists.length > 0) {
        this.form.patchValue({ dentistId: dentists[0].id });
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    const patientId = this.route.snapshot.queryParamMap.get('patientId');

    if (id) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.appointmentService.getById(id).subscribe({
        next: appointment => {
          this.appointment.set(appointment);
          this.currentPatientId = appointment.patientId;
          this.applyPatientFilter();

          const start = new Date(appointment.startTime);
          const end = new Date(appointment.endTime);
          this.form.patchValue({
            patientId: appointment.patientId,
            dentistId: appointment.dentistId,
            date: this.ymd(start),
            startTime: this.hm(start),
            endTime: this.hm(end),
            motif: appointment.motif,
            observation: appointment.observation ?? '',
          });
          this.loading.set(false);
        },
        error: error => {
          this.loading.set(false);
          this.error.set(error instanceof Error ? error.message : 'Rendez-vous introuvable.');
        },
      });
    } else if (patientId) {
      this.form.patchValue({ patientId });
    }
  }

  /**
   * Seuls les patients sans rendez-vous existant sont proposés dans le select.
   * En modification, le patient du rendez-vous courant reste sélectionnable.
   */
  private loadSelectablePatients(): void {
    forkJoin({
      patients: this.patientService.listAll(),
      appointments: this.appointmentService.list({}),
    }).subscribe({
      next: ({ patients, appointments }) => {
        this.allPatients = patients;
        this.bookedPatientIds = new Set(appointments.map(appointment => appointment.patientId));
        this.applyPatientFilter();
      },
      error: () => {
        this.patientService.listAll().subscribe(items => {
          this.allPatients = items;
          this.applyPatientFilter();
        });
      },
    });
  }

  private applyPatientFilter(): void {
    const referenceId = this.referencePatient()?.id;
    this.patients.set(this.allPatients.filter(patient =>
      !this.bookedPatientIds.has(patient.id)
      || patient.id === this.currentPatientId
      || patient.id === referenceId));
  }

  /** Recherche par numéro de référence : autorise un patient déjà pourvu d'un rendez-vous. */
  searchByReference(): void {
    const number = this.referenceInput().trim().toUpperCase();
    if (!number) {
      this.referenceError.set('Saisissez le numéro de référence du patient.');
      return;
    }

    this.searchingReference.set(true);
    this.referenceError.set(null);

    this.patientService.getByNumber(number).subscribe({
      next: patient => {
        this.searchingReference.set(false);
        this.referencePatient.set(patient);
        if (!this.allPatients.some(item => item.id === patient.id)) {
          this.allPatients = [patient, ...this.allPatients];
        }
        this.applyPatientFilter();
        this.form.patchValue({ patientId: patient.id });
      },
      error: () => {
        this.searchingReference.set(false);
        this.referencePatient.set(null);
        this.referenceError.set(`Aucun patient trouvé avec la référence « ${number} ».`);
      },
    });
  }

  onReferenceInput(value: string): void {
    this.referenceInput.set(value);
    this.referenceError.set(null);
    if (this.referencePatient()) {
      this.referencePatient.set(null);
      this.applyPatientFilter();
    }
  }

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

    if (!this.patients().some(patient => patient.id === v.patientId)) {
      this.error.set('Ce patient a déjà un rendez-vous. Saisissez son numéro de référence pour l’ajouter.');
      return;
    }

    const startISO = `${v.date}T${v.startTime}:00`;
    const endISO = `${v.date}T${v.endTime}:00`;

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

      const request = this.isEdit() && this.appointment()
        ? this.appointmentService.update(this.appointment()!.id, {
          patientId: v.patientId,
          dentistId: v.dentistId,
          startTime: startISO,
          endTime: endISO,
          motif: v.motif,
          observation: v.observation,
        })
        : this.appointmentService.create({
          patientId: v.patientId,
          dentistId: v.dentistId,
          startTime: startISO,
          endTime: endISO,
          motif: v.motif,
          observation: v.observation,
        });

      request.subscribe({
        next: () => this.router.navigate(['/appointments']),
        error: (e: Error) => {
          this.saving.set(false);
          this.error.set(e.message);
        },
      });
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

  private ymd(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private hm(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}
