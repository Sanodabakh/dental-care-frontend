import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideAlertTriangle as AlertTriangle,
  LucideArchive as Archive,
  LucideArrowLeft as ArrowLeft,
  LucideCalendarDays as CalendarDays,
  LucideClock as Clock,
  LucideEdit as Edit,
  LucideFileText as FileText,
  LucideFolderOpen as FolderOpen,
  LucideHeart as Heart,
  LucideMail as Mail,
  LucideMapPin as MapPin,
  LucidePhone as Phone,
  LucidePill as Pill,
  LucidePlus as Plus,
  LucideReceipt as Receipt,
  LucideSmile as Smile,
  LucideStethoscope as Stethoscope,
  LucideUser as User,
  LucideWallet as Wallet,
  type LucideIcon,
} from '@lucide/angular';
import { PatientService } from '../patient.service';
import { Patient } from '../../../shared/models/patient.model';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

type TabId = 'info' | 'medical' | 'consultations' | 'odontogram'
           | 'appointments' | 'invoices' | 'payments' | 'documents';

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideIconComponent, DateFrPipe],
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.css'],
})
export class PatientDetailComponent implements OnInit {
  private readonly patientService = inject(PatientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly icons = {
    ArrowLeft, Edit, Archive, User, FileText, Stethoscope, Smile, CalendarDays,
    Receipt, Wallet, FolderOpen, Phone, Mail, MapPin, AlertTriangle, Heart,
    Pill, Clock, Plus,
  };

  readonly loading = signal(true);
  readonly patient = signal<Patient | null>(null);
  readonly activeTab = signal<TabId>('info');

  readonly tabs: Tab[] = [
    { id: 'info',          label: 'Informations',    icon: User },
    { id: 'medical',       label: 'Dossier médical', icon: FileText },
    { id: 'consultations', label: 'Consultations',   icon: Stethoscope },
    { id: 'odontogram',    label: 'Odontogramme',    icon: Smile },
    { id: 'appointments',  label: 'Rendez-vous',     icon: CalendarDays },
    { id: 'invoices',      label: 'Factures',        icon: Receipt },
    { id: 'payments',      label: 'Paiements',       icon: Wallet },
    { id: 'documents',     label: 'Documents',       icon: FolderOpen },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/patients']);
      return;
    }
    this.patientService.getById(id).subscribe(p => {
      if (!p) {
        this.router.navigate(['/patients']);
        return;
      }
      this.patient.set(p);
      this.loading.set(false);
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
}