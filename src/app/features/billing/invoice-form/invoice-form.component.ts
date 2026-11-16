import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft as ArrowLeft,
  LucidePlus as Plus,
  LucideSave as Save,
  LucideTrash2 as Trash,
} from '@lucide/angular';
import { InvoiceCreateDto, InvoiceService } from '../invoice.service';
import { Patient } from '../../../shared/models/patient.model';
import { Treatment } from '../../../shared/models/treatment.model';
import { PatientService } from '../../patients/patient.service';
import { TreatmentService } from '../../treatments/treatment.service';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

interface InvoiceDraftLine {
  treatmentId?: string;
  description: string;
  quantity: number;
  unitPriceFcfa: number;
}

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [FormsModule, RouterLink, FcfaPipe, LucideIconComponent],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css'],
})
export class InvoiceFormComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly patientService = inject(PatientService);
  private readonly treatmentService = inject(TreatmentService);
  private readonly router = inject(Router);

  readonly icons = { ArrowLeft, Plus, Save, Trash };
  readonly patientNumber = signal('');
  readonly patient = signal<Patient | null>(null);
  readonly treatments = signal<Treatment[]>([]);
  readonly lines = signal<InvoiceDraftLine[]>([this.emptyLine()]);
  readonly discountFcfa = signal(0);
  readonly loadingPatient = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly patientMessage = signal('');

  get subtotalFcfa(): number {
    return this.lines().reduce(
      (sum, line) => sum + line.quantity * line.unitPriceFcfa,
      0,
    );
  }

  get totalFcfa(): number {
    return Math.max(0, this.subtotalFcfa - this.discountFcfa());
  }

  ngOnInit(): void {
    this.treatmentService.list({ activeOnly: true }).subscribe({
      next: items => this.treatments.set(items),
      error: error => this.error.set(
        error instanceof Error ? error.message : 'Impossible de charger les actes.',
      ),
    });
  }

  searchPatient(): void {
    const number = this.patientNumber().trim();
    if (!number) {
      this.patientMessage.set('Saisissez le numéro du patient.');
      this.patient.set(null);
      return;
    }
    this.loadingPatient.set(true);
    this.patientMessage.set('');
    this.patientService.getByNumber(number).subscribe({
      next: patient => {
        this.patient.set(patient ?? null);
        this.patientMessage.set(patient ? '' : 'Aucun patient ne correspond à ce numéro.');
        this.loadingPatient.set(false);
      },
      error: error => {
        this.patientMessage.set(
          error instanceof Error ? error.message : 'Impossible de rechercher le patient.',
        );
        this.loadingPatient.set(false);
      },
    });
  }

  addLine(): void {
    this.lines.update(lines => [...lines, this.emptyLine()]);
  }

  removeLine(index: number): void {
    if (this.lines().length === 1) return;
    this.lines.update(lines => lines.filter((_, lineIndex) => lineIndex !== index));
  }

  updateDescription(index: number, description: string): void {
    this.updateLine(index, { description, treatmentId: undefined });
  }

  updateQuantity(index: number, value: string | number): void {
    this.updateLine(index, { quantity: this.toNonNegativeNumber(value) });
  }

  updatePrice(index: number, value: string | number): void {
    this.updateLine(index, { unitPriceFcfa: this.toNonNegativeNumber(value) });
  }

  updateDiscount(value: string | number): void {
    this.discountFcfa.set(this.toNonNegativeNumber(value));
  }

  selectTreatment(index: number, treatmentId: string): void {
    const treatment = this.treatments().find(item => item.id === treatmentId);
    this.updateLine(index, treatment
      ? {
          treatmentId: treatment.id,
          description: treatment.name,
          unitPriceFcfa: treatment.priceFcfa,
        }
      : { treatmentId: undefined });
  }

  save(): void {
    const patient = this.patient();
    if (!patient) {
      this.error.set('Recherchez et sélectionnez un patient avant de créer la facture.');
      return;
    }
    if (this.lines().some(line => !line.description.trim() || line.quantity <= 0)) {
      this.error.set('Chaque ligne doit avoir une description et une quantité supérieure à zéro.');
      return;
    }
    if (this.discountFcfa() > this.subtotalFcfa) {
      this.error.set('La remise ne peut pas dépasser le sous-total.');
      return;
    }

    const dto: InvoiceCreateDto = {
      patientId: patient.id,
      patientNumber: patient.patientNumber,
      patientName: `${patient.firstName} ${patient.lastName}`,
      discountFcfa: this.discountFcfa(),
      lines: this.lines().map(({ treatmentId, ...line }) => ({
        ...line,
        ...(treatmentId ? { treatmentId } : {}),
      })),
    };

    this.error.set('');
    this.saving.set(true);
    this.invoiceService.create(dto).subscribe({
      next: invoice => {
        this.saving.set(false);
        void this.router.navigate(['/billing', invoice.id]);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible de créer la facture.');
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/billing']);
  }

  private updateLine(index: number, patch: Partial<InvoiceDraftLine>): void {
    this.lines.update(lines => lines.map((line, lineIndex) =>
      lineIndex === index ? { ...line, ...patch } : line,
    ));
  }

  private emptyLine(): InvoiceDraftLine {
    return { description: '', quantity: 1, unitPriceFcfa: 0 };
  }

  private toNonNegativeNumber(value: string | number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }
}
