import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideCheck,
  LucideMessageSquare,
  LucideSearch,
  LucideSend,
  LucideX,
} from '@lucide/angular';
import { NotificationService } from '../notification.service';
import { PatientService } from '../../patients/patient.service';
import { Patient } from '../../../shared/models/patient.model';
import {
  NotificationChannel,
  NotificationType,
} from '../../../shared/models/notification.model';

@Component({
  selector: 'app-notification-form',
  standalone: true,
  imports: [
    FormsModule, RouterLink,
    LucideArrowLeft, LucideSearch, LucideSend, LucideMessageSquare, LucideCheck, LucideX,
  ],
  templateUrl: './notification-form.component.html',
  styleUrls: ['./notification-form.component.css'],
})
export class NotificationFormComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly patientService = inject(PatientService);
  private readonly router = inject(Router);

  readonly searching = signal(false);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedPatient = signal<Patient | null>(null);
  readonly sent = signal(false);
  readonly sentType = signal<NotificationType>('CONFIRMATION_RDV');
  readonly patientNumberInput = signal('');
  readonly type = signal<NotificationType>('CONFIRMATION_RDV');
  readonly channel = signal<NotificationChannel>('SMS');
  readonly message = signal('');

  readonly types: Array<{ value: NotificationType; label: string }> = [
    { value: 'CONFIRMATION_RDV', label: 'Confirmation de RDV' },
    { value: 'RAPPEL_RDV', label: 'Rappel de RDV' },
    { value: 'FACTURE', label: 'Facture' },
    { value: 'RELANCE_PAIEMENT', label: 'Relance de paiement' },
    { value: 'AUTRE', label: 'Autre' },
  ];
  readonly channels: Array<{ value: NotificationChannel; label: string }> = [
    { value: 'SMS', label: 'SMS' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'EMAIL', label: 'E-mail' },
  ];

  searchPatient(): void {
    const number = this.patientNumberInput().trim().toUpperCase();
    if (!number) {
      this.error.set('Saisissez un numéro de patient.');
      return;
    }

    this.searching.set(true);
    this.error.set(null);
    this.patientService.list({ search: number, page: 0, size: 10 }).subscribe({
      next: result => {
        this.searching.set(false);
        const patient = result.items.find(item => item.patientNumber.toUpperCase() === number);
        if (!patient) {
          this.selectedPatient.set(null);
          this.error.set(`Patient « ${number} » introuvable.`);
          return;
        }
        this.selectedPatient.set(patient);
        this.generateTemplate();
      },
      error: error => {
        this.searching.set(false);
        this.error.set(error instanceof Error ? error.message : 'Impossible de rechercher le patient.');
      },
    });
  }

  generateTemplate(): void {
    const patient = this.selectedPatient();
    if (!patient) return;
    const templates: Record<NotificationType, string> = {
      CONFIRMATION_RDV: `Bonjour ${patient.firstName}, votre rendez-vous est confirmé. DentalCare.`,
      RAPPEL_RDV: 'Rappel : vous avez un rendez-vous prévu. DentalCare.',
      FACTURE: `Bonjour ${patient.firstName}, votre facture est disponible. DentalCare.`,
      RELANCE_PAIEMENT: `Bonjour ${patient.firstName}, nous vous rappelons le solde de votre facture. DentalCare.`,
      AUTRE: `Bonjour ${patient.firstName}, `,
    };
    this.message.set(templates[this.type()]);
  }

  onTypeChange(value: string): void {
    const selected = this.types.find(item => item.value === value);
    if (!selected) return;
    this.type.set(selected.value);
    this.generateTemplate();
  }

  onChannelChange(value: string): void {
    if (value === 'SMS' || value === 'WHATSAPP' || value === 'EMAIL') {
      this.channel.set(value);
    }
  }

  send(): void {
    const patient = this.selectedPatient();
    if (!patient) {
      this.error.set('Sélectionnez un patient.');
      return;
    }
    const phone = patient.phone?.trim();
    if (!phone) {
      this.error.set('Ce patient n’a pas de numéro de téléphone renseigné.');
      return;
    }
    if (!this.message().trim()) {
      this.error.set('Le message est vide.');
      return;
    }

    this.sending.set(true);
    this.error.set(null);
    this.sentType.set(this.type());
    this.notificationService.send({
      patientId: patient.id,
      patientNumber: patient.patientNumber,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientPhone: phone,
      type: this.type(),
      channel: this.channel(),
      message: this.message(),
    }).subscribe({
      next: () => {
        this.sending.set(false);
        this.sent.set(true);
      },
      error: error => {
        this.sending.set(false);
        this.error.set(error instanceof Error ? error.message : 'Impossible d’envoyer la notification.');
      },
    });
  }

  reset(): void {
    this.selectedPatient.set(null);
    this.patientNumberInput.set('');
    this.message.set('');
    this.error.set(null);
    this.sent.set(false);
  }

  cancel(): void {
    void this.router.navigate(['/notifications']);
  }
}
