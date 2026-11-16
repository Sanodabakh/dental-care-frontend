import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../patients/patient.service';
import { OdontogramService } from './odontogram.service';
import { Patient } from '../../shared/models/patient.model';
import {
  DentalObservation, ToothCondition, ToothState,
} from '../../shared/models/odontogram.model';
import { DateFrPipe } from '../../shared/pipes/date-fr.pipe';

@Component({
  selector: 'app-odontogram',
  standalone: true,
  imports: [CommonModule, DateFrPipe],
  templateUrl: './odontogram.component.html',
  styleUrls: ['./odontogram.component.css'],
})
export class OdontogramComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientService = inject(PatientService);
  private readonly odontogramService = inject(OdontogramService);

  readonly searching = signal(false);
  readonly patientNumberInput = signal('');
  readonly patientError = signal<string | null>(null);
  readonly patient = signal<Patient | null>(null);
  readonly loading = signal(false);
  readonly toothStates = signal<Map<string, ToothState>>(new Map());
  readonly selectedTooth = signal<string | null>(null);
  readonly toothHistory = signal<DentalObservation[]>([]);
  readonly patientHistory = signal<DentalObservation[]>([]);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly newCondition = signal<ToothCondition>('SAINE');
  readonly newObservation = signal('');

  readonly conditions: { value: ToothCondition; label: string; color: string }[] = [
    { value: 'SAINE',     label: 'Saine',       color: '#FFFFFF' },
    { value: 'CARIE',     label: 'Carie',       color: '#f4c2b9' },
    { value: 'OBTURATION',label: 'Obturation',  color: '#a9dbd2' },
    { value: 'COURONNE',  label: 'Couronne',    color: '#f7dfa0' },
    { value: 'ENDO',      label: 'Endodontie',  color: '#d9c7f5' },
    { value: 'IMPLANT',   label: 'Implant',     color: '#c2e8de' },
    { value: 'ABSENTE',   label: 'Absente',     color: '#d1d8dc' },
    { value: 'EXTRAITE',  label: 'Extraite',    color: '#b8c2c8' },
    { value: 'FRACTURE',  label: 'Fracture',    color: '#f1b3ad' },
    { value: 'MOBILITE',  label: 'Mobilité',    color: '#f4c89e' },
    { value: 'PROTHESE',  label: 'Prothèse',    color: '#b8e4e9' },
  ];

  readonly upperRight = ['18','17','16','15','14','13','12','11'];
  readonly upperLeft  = ['21','22','23','24','25','26','27','28'];
  readonly lowerRight = ['48','47','46','45','44','43','42','41'];
  readonly lowerLeft  = ['31','32','33','34','35','36','37','38'];

  readonly legend = [
    { label: 'Sans observation', color: '#e7ecee' },
    { label: 'Carie', color: '#f4c2b9' },
    { label: 'Traitement', color: '#a9dbd2' },
    { label: 'Absente / extraite', color: '#b8c2c8' },
  ];

  readonly selectedToothState = computed(() => {
    const num = this.selectedTooth();
    return num ? this.toothStates().get(num) ?? null : null;
  });

  ngOnInit(): void {
    const patientId = this.route.snapshot.paramMap.get('patientId');
    if (patientId) {
      this.loadPatientById(patientId);
    }
  }

  searchPatient(): void {
    const patientNumber = this.patientNumberInput().trim().toUpperCase();
    if (!patientNumber) {
      this.patientError.set('Veuillez saisir un numéro de patient.');
      return;
    }

    this.searching.set(true);
    this.patientError.set(null);
    this.selectedTooth.set(null);
    this.toothHistory.set([]);
    this.patient.set(null);
    this.toothStates.set(new Map());
    this.patientHistory.set([]);
    this.router.navigate(['/odontograms'], { replaceUrl: true });

    this.patientService.list({ search: patientNumber, page: 0, size: 10 }).subscribe({
      next: result => {
        this.searching.set(false);
        const found = result.items.find(
          item => item.patientNumber.toUpperCase() === patientNumber,
        );
        if (!found) {
          this.patientError.set(`Aucun patient trouvé avec le numéro « ${patientNumber} ».`);
          return;
        }

        this.toothStates.set(new Map());
        this.patientHistory.set([]);
        this.patient.set(found);
        this.loadOdontogram(found.id);
        this.router.navigate(['/odontograms', found.id], { replaceUrl: true });
      },
      error: () => {
        this.searching.set(false);
        this.patientError.set('Erreur lors de la recherche du patient.');
      },
    });
  }

  private loadPatientById(id: string): void {
    this.loading.set(true);
    this.patientService.getById(id).subscribe({
      next: p => {
        if (p) {
          this.patient.set(p);
          this.patientNumberInput.set(p.patientNumber);
          this.loadOdontogram(p.id);
        } else {
          this.patientError.set('Patient introuvable.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.patientError.set('Impossible de charger ce patient.');
        this.loading.set(false);
      },
    });
  }

  private loadOdontogram(patientId: string): void {
    this.odontogramService.getToothStates(patientId).subscribe(states => {
      const map = new Map<string, ToothState>();
      states.forEach(s => map.set(s.toothNumber, s));
      this.toothStates.set(map);
    });
    this.odontogramService.getObservationsForPatient(patientId).subscribe(observations => {
      this.patientHistory.set(
        [...observations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    });
  }

  selectTooth(toothNumber: string): void {
    this.selectedTooth.set(toothNumber);
    this.newCondition.set('SAINE');
    this.newObservation.set('');
    this.saveError.set(null);

    const patient = this.patient();
    if (patient) {
      this.odontogramService.getToothHistory(patient.id, toothNumber)
        .subscribe(history => this.toothHistory.set(history));
    }
  }

  addObservation(): void {
    const patient = this.patient();
    const tooth = this.selectedTooth();
    if (!patient || !tooth) return;

    this.saving.set(true);
    this.saveError.set(null);
    this.odontogramService.addObservation({
      patientId: patient.id,
      patientNumber: patient.patientNumber,
      toothNumber: tooth,
      condition: this.newCondition(),
      observation: this.newObservation(),
      createdBy: 'Dr. Omar Fall',
    }).subscribe(() => {
      this.saving.set(false);
      this.loadOdontogram(patient.id);
      this.odontogramService.getToothHistory(patient.id, tooth)
        .subscribe(history => this.toothHistory.set(history));
    }, () => {
      this.saving.set(false);
      this.saveError.set('Impossible d’enregistrer cette observation.');
    });
  }

  toothColor(toothNumber: string): string {
    const state = this.toothStates().get(toothNumber);
    if (!state) return '#e7ecee';
    const c = this.conditions.find(c => c.value === state.currentCondition);
    return c?.color ?? '#FFFFFF';
  }

  toothLabel(toothNumber: string): string {
    const state = this.toothStates().get(toothNumber);
    if (!state) return 'Sans observation';
    const c = this.conditions.find(c => c.value === state.currentCondition);
    return c?.label ?? 'Saine';
  }

  conditionLabel(condition: ToothCondition): string {
    return this.conditions.find(item => item.value === condition)?.label ?? condition;
  }

  conditionColor(condition: ToothCondition): string {
    return this.conditions.find(item => item.value === condition)?.color ?? '#e7ecee';
  }
}