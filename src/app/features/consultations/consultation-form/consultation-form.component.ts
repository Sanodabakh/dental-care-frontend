import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
// ✅ @lucide/angular
import {
  LucideArrowLeft, LucideSearch, LucideCheck, LucideSave,
  LucideStethoscope, LucideFileText, LucideHeartPulse,
} from '@lucide/angular';
import { ConsultationService } from '../consultation.service';
import { PatientService } from '../../patients/patient.service';
import { Patient } from '../../../shared/models/patient.model';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    LucideArrowLeft, LucideSearch, LucideCheck, LucideSave,
    LucideStethoscope, LucideFileText, LucideHeartPulse,
    DateFrPipe,
  ],
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.css'],
})
export class ConsultationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly consultationService = inject(ConsultationService);
  private readonly patientService = inject(PatientService);
  private readonly router = inject(Router);

  // ============ ÉTATS
  readonly searching = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly selectedPatient = signal<Patient | null>(null);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly consultationId = signal<string | null>(null);

  // ============ RECHERCHE PAR NUMÉRO
  readonly patientNumberInput = signal('');

  // ============ FORMULAIRE
  readonly form: FormGroup = this.fb.group({
    symptoms: [''],
    clinicalExam: [''],
    diagnosis: ['', [Validators.required]],
    treatmentPlan: [''],
    observations: [''],
  });

  readonly dentistId = 'd1';
  readonly dentistName = 'Dr. Omar Fall';

  // ============ RECHERCHE PATIENT
  searchPatient(): void {
    const num = this.patientNumberInput().trim().toUpperCase();
    if (!num) {
      this.searchError.set('Veuillez saisir un numéro de patient');
      return;
    }

    this.searching.set(true);
    this.searchError.set(null);
    this.selectedPatient.set(null);

    // Recherche par numéro de référence (ex: PAT-2026-0001)
    this.patientService.list({ search: num, page: 0, size: 10 }).subscribe({
      next: res => {
        this.searching.set(false);
        const found = res.items.find(p => p.patientNumber === num);
        if (found) {
          this.selectedPatient.set(found);
        } else {
          this.searchError.set(`Aucun patient trouvé avec le numéro "${num}"`);
        }
      },
      error: () => {
        this.searching.set(false);
        this.searchError.set('Erreur lors de la recherche');
      },
    });
  }

  // ============ SAUVEGARDE
  save(asDraft: boolean): void {
    const patient = this.selectedPatient();
    if (!patient) {
      this.searchError.set('Veuillez d\'abord sélectionner un patient');
      return;
    }

    if (!asDraft && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    this.consultationService.create({
      patientId: patient.id,
      patientNumber: patient.patientNumber,
      dentistId: this.dentistId,
      symptoms: this.form.value.symptoms,
      clinicalExam: this.form.value.clinicalExam,
      diagnosis: this.form.value.diagnosis,
      treatmentPlan: this.form.value.treatmentPlan,
      observations: this.form.value.observations,
    }).subscribe(consultation => {
      this.consultationId.set(consultation.id);
      if (!asDraft) {
        this.consultationService.validate(consultation.id).subscribe(() => {
          this.saving.set(false);
          this.saved.set(true);
        });
      } else {
        this.saving.set(false);
        this.saved.set(true);
      }
    });
  }

  goToOdontogram(): void {
    const patient = this.selectedPatient();
    if (patient) {
      this.router.navigate(['/odontograms', patient.id]);
    }
  }

  reset(): void {
    this.selectedPatient.set(null);
    this.patientNumberInput.set('');
    this.form.reset();
    this.saved.set(false);
    this.consultationId.set(null);
  }

  initials(p: Patient): string {
    return (p.firstName[0] + p.lastName[0]).toUpperCase();
  }
}