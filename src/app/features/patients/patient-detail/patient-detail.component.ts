import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  LucideAlertTriangle as AlertTriangle,
  LucideArchive as Archive,
  LucideArrowLeft as ArrowLeft,
  LucideBell as Bell,
  LucideCalendarDays as CalendarDays,
  LucideDownload as Download,
  LucideEdit as Edit,
  LucideFileText as FileText,
  LucideHeart as Heart,
  LucideMail as Mail,
  LucideMapPin as MapPin,
  LucidePhone as Phone,
  LucidePlus as Plus,
  LucideReceipt as Receipt,
  LucideSmile as Smile,
  LucideStethoscope as Stethoscope,
  LucideUser as User,
  LucideWallet as Wallet,
  type LucideIcon,
} from '@lucide/angular';
import { PatientService } from '../patient.service';
import { AppointmentService } from '../../appointments/appointment.service';
import { ConsultationService } from '../../consultations/consultation.service';
import { InvoiceService } from '../../billing/invoice.service';
import { PaymentService } from '../../payments/services/payment.service';
import { NotificationService } from '../../notifications/notification.service';
import { OdontogramService } from '../../odontogram/odontogram.service';
import { Patient } from '../../../shared/models/patient.model';
import { Appointment, AppointmentStatus } from '../../../shared/models/appointment.model';
import { Consultation, ConsultationStatus } from '../../../shared/models/consultation.model';
import { Invoice, InvoiceStatus } from '../../../shared/models/invoice.model';
import { Payment, PaymentMethod, PAYMENT_METHOD_LABELS } from '../../../shared/models/payment.model';
import { Notification } from '../../../shared/models/notification.model';
import { ToothCondition, ToothState } from '../../../shared/models/odontogram.model';
import { saveBlob } from '../../../core/services/download';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

type TabId = 'info' | 'appointments' | 'consultations' | 'odontogram'
           | 'invoices' | 'payments' | 'notifications';

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideIconComponent, DateFrPipe, FcfaPipe],
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.css'],
})
export class PatientDetailComponent implements OnInit {
  private readonly patientService = inject(PatientService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly consultationService = inject(ConsultationService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly paymentService = inject(PaymentService);
  private readonly notificationService = inject(NotificationService);
  private readonly odontogramService = inject(OdontogramService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly icons = {
    ArrowLeft, Edit, Archive, User, FileText, Stethoscope, Smile, CalendarDays,
    Receipt, Wallet, Phone, Mail, MapPin, AlertTriangle, Heart, Plus, Download, Bell,
  };

  readonly loading = signal(true);
  readonly relatedLoading = signal(true);
  readonly error = signal('');
  readonly patient = signal<Patient | null>(null);
  readonly activeTab = signal<TabId>('info');

  readonly appointments = signal<Appointment[]>([]);
  readonly consultations = signal<Consultation[]>([]);
  readonly invoices = signal<Invoice[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly notifications = signal<Notification[]>([]);
  readonly teeth = signal<ToothState[]>([]);
  readonly downloadingId = signal<string | null>(null);

  readonly tabs: Tab[] = [
    { id: 'info',          label: 'Informations',   icon: User },
    { id: 'appointments',  label: 'Rendez-vous',    icon: CalendarDays },
    { id: 'consultations', label: 'Consultations',  icon: Stethoscope },
    { id: 'odontogram',    label: 'Odontogramme',   icon: Smile },
    { id: 'invoices',      label: 'Factures',       icon: Receipt },
    { id: 'payments',      label: 'Paiements',      icon: Wallet },
    { id: 'notifications', label: 'Notifications',  icon: Bell },
  ];

  readonly toothConditions: Array<{ value: ToothCondition; label: string; color: string }> = [
    { value: 'SAINE', label: 'Saine', color: '#FFFFFF' },
    { value: 'CARIE', label: 'Carie', color: '#f4c2b9' },
    { value: 'OBTURATION', label: 'Obturation', color: '#a9dbd2' },
    { value: 'COURONNE', label: 'Couronne', color: '#f7dfa0' },
    { value: 'DEVIALISEE', label: 'Dévitalisée', color: '#d9c7f5' },
    { value: 'EXTRACTION_INDIQUEE', label: 'Extraction indiquée', color: '#f1b3ad' },
    { value: 'EXTRACTEE', label: 'Extraite', color: '#b8c2c8' },
    { value: 'IMPLANT', label: 'Implant', color: '#c2e8de' },
    { value: 'PROTHESE', label: 'Prothèse', color: '#b8e4e9' },
    { value: 'FRACTURE', label: 'Fracture', color: '#f1b3ad' },
    { value: 'ABSENTE', label: 'Absente', color: '#d1d8dc' },
  ];

  readonly upcomingAppointments = computed(() => {
    const now = new Date().toISOString();
    return this.appointments().filter(appointment =>
      !['ANNULE', 'TERMINE', 'ABSENT'].includes(appointment.status)
      && appointment.startTime >= now).length;
  });

  readonly balanceDue = computed(() =>
    this.invoices()
      .filter(invoice => invoice.status !== 'ANNULEE' && invoice.status !== 'BROUILLON')
      .reduce((sum, invoice) => sum + invoice.balanceFcfa, 0));

  readonly totalPaid = computed(() =>
    this.payments().reduce((sum, payment) => sum + payment.amountFcfa, 0));

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/patients']);
        return;
      }
      this.loadPatient(id);
    });
  }

  private loadPatient(id: string): void {
    this.loading.set(true);
    this.error.set('');
    this.patient.set(null);
    this.appointments.set([]);
    this.consultations.set([]);
    this.invoices.set([]);
    this.payments.set([]);
    this.notifications.set([]);
    this.teeth.set([]);

    this.patientService.getById(id).subscribe({
      next: patient => {
        this.patient.set(patient);
        this.loading.set(false);
        this.loadRelated(id);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Patient introuvable.');
        this.loading.set(false);
      },
    });
  }

  private loadRelated(id: string): void {
    this.relatedLoading.set(true);
    forkJoin({
      appointments: this.appointmentService.list({ patientId: id }).pipe(catchError(() => of([]))),
      consultations: this.consultationService.list({ patientId: id }).pipe(catchError(() => of([]))),
      invoices: this.invoiceService.list({ patientId: id }).pipe(catchError(() => of([]))),
      payments: this.paymentService.list({ patientId: id }).pipe(catchError(() => of([]))),
      notifications: this.notificationService.list({ patientId: id }).pipe(catchError(() => of([]))),
      teeth: this.odontogramService.getToothStates(id).pipe(catchError(() => of([]))),
    }).subscribe(({ appointments, consultations, invoices, payments, notifications, teeth }) => {
      this.appointments.set([...appointments].sort((a, b) => b.startTime.localeCompare(a.startTime)));
      this.consultations.set([...consultations].sort((a, b) =>
        b.consultationDate.localeCompare(a.consultationDate)));
      this.invoices.set([...invoices].sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate)));
      this.payments.set([...payments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate)));
      this.notifications.set([...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      this.teeth.set([...teeth].sort((a, b) => a.toothNumber.localeCompare(b.toothNumber)));
      this.relatedLoading.set(false);
    });
  }

  setTab(id: TabId): void {
    this.activeTab.set(id);
  }

  archive(): void {
    const p = this.patient();
    if (!p) return;
    if (confirm(`Archiver le patient ${p.firstName} ${p.lastName} ?`)) {
      this.patientService.archive(p.id).subscribe(() => this.router.navigate(['/patients']));
    }
  }

  downloadReceipt(payment: Payment): void {
    this.downloadingId.set(payment.id);
    this.paymentService.downloadReceipt(payment.id).subscribe({
      next: response => {
        saveBlob(response, `recu-${payment.receiptNumber}.pdf`);
        this.downloadingId.set(null);
      },
      error: () => this.downloadingId.set(null),
    });
  }

  initials(p: Patient): string {
    return (p.firstName[0] + p.lastName[0]).toUpperCase();
  }

  fullName(p: Patient): string {
    return `${p.firstName} ${p.lastName}`;
  }

  age(p: Patient): number | null {
    if (!p.birthDate) return null;
    const birth = new Date(p.birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }

  formatDate(value: string): string {
    return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
  }

  formatTime(value: string): string {
    return value && value.length > 5 ? value.slice(11, 16) : value;
  }

  appointmentStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      EN_ATTENTE: 'En attente',
      CONFIRME: 'Confirmé',
      ARRIVE: 'Arrivé',
      EN_CONSULTATION: 'En consultation',
      TERMINE: 'Terminé',
      ANNULE: 'Annulé',
      ABSENT: 'Absent',
      REPORTE: 'Reporté',
    };
    return labels[status];
  }

  appointmentStatusClass(status: AppointmentStatus): string {
    if (['CONFIRME', 'ARRIVE', 'TERMINE'].includes(status)) return 'dc-badge dc-badge-success';
    if (['EN_ATTENTE', 'REPORTE'].includes(status)) return 'dc-badge dc-badge-warning';
    if (['ANNULE', 'ABSENT'].includes(status)) return 'dc-badge dc-badge-danger';
    return 'dc-badge dc-badge-info';
  }

  consultationStatusLabel(status: ConsultationStatus): string {
    return status === 'VALIDEE' ? 'Validée' : 'Brouillon';
  }

  consultationStatusClass(status: ConsultationStatus): string {
    return status === 'VALIDEE' ? 'dc-badge dc-badge-success' : 'dc-badge dc-badge-warning';
  }

  invoiceStatusLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = {
      BROUILLON: 'Brouillon',
      VALIDEE: 'Validée',
      PARTIELLEMENT_PAYEE: 'Partiellement payée',
      PAYEE: 'Payée',
      ANNULEE: 'Annulée',
    };
    return labels[status];
  }

  invoiceStatusClass(status: InvoiceStatus): string {
    if (status === 'PAYEE') return 'dc-badge dc-badge-success';
    if (status === 'ANNULEE') return 'dc-badge dc-badge-danger';
    if (status === 'VALIDEE' || status === 'PARTIELLEMENT_PAYEE') return 'dc-badge dc-badge-warning';
    return 'dc-badge dc-badge-neutral';
  }

  methodLabel(method: PaymentMethod): string {
    return PAYMENT_METHOD_LABELS[method] ?? method;
  }

  notificationTypeLabel(type: Notification['type']): string {
    const labels: Record<Notification['type'], string> = {
      RAPPEL_RDV: 'Rappel RDV',
      CONFIRMATION_RDV: 'Confirmation RDV',
      FACTURE: 'Facture',
      RELANCE_PAIEMENT: 'Relance paiement',
      AUTRE: 'Autre',
    };
    return labels[type];
  }

  notificationStatusLabel(status: Notification['status']): string {
    const labels: Record<Notification['status'], string> = {
      EN_ATTENTE: 'En attente',
      ENVOYEE: 'Envoyée',
      ECHEC: 'Échec',
    };
    return labels[status];
  }

  notificationStatusClass(status: Notification['status']): string {
    if (status === 'ENVOYEE') return 'dc-badge dc-badge-success';
    if (status === 'ECHEC') return 'dc-badge dc-badge-danger';
    return 'dc-badge dc-badge-warning';
  }

  channelLabel(channel: Notification['channel']): string {
    if (channel === 'WHATSAPP') return 'WhatsApp';
    if (channel === 'EMAIL') return 'E-mail';
    return 'SMS';
  }

  conditionLabel(condition: ToothCondition): string {
    return this.toothConditions.find(item => item.value === condition)?.label ?? condition;
  }

  conditionColor(condition: ToothCondition): string {
    return this.toothConditions.find(item => item.value === condition)?.color ?? '#e7ecee';
  }
}
