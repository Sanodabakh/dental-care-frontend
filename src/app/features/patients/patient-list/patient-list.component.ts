import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideArchive as Archive,
  LucideChevronLeft as ChevronLeft,
  LucideChevronRight as ChevronRight,
  LucideDownload as Download,
  LucideEdit as Edit,
  LucideEye as Eye,
  LucideFilter as Filter,
  LucideMoreHorizontal as MoreHorizontal,
  LucidePlus as Plus,
  LucideSearch as Search,
} from '@lucide/angular';
import { PatientService } from '../patient.service';
import { Patient, PatientStatus } from '../../../shared/models/patient.model';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideIconComponent, DateFrPipe],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.css'],
})
export class PatientListComponent implements OnInit {
  private readonly patientService = inject(PatientService);

  readonly icons = {
    Search, Plus, MoreHorizontal, Filter, ChevronLeft, ChevronRight,
    Edit, Eye, Archive, Download,
  };

  // ============ ÉTATS ============
  readonly loading = signal(true);
  readonly patients = signal<Patient[]>([]);
  readonly total = signal(0);

  // ============ FILTRES ============
  readonly search = signal('');
  readonly status = signal<PatientStatus | 'ALL'>('ALL');
  readonly page = signal(0);
  readonly size = signal(10);

  readonly totalPages = computed(() => Math.ceil(this.total() / this.size()));
  readonly pageStart = computed(() => this.total() === 0 ? 0 : this.page() * this.size() + 1);
  readonly pageEnd = computed(() => Math.min((this.page() + 1) * this.size(), this.total()));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.patientService.list({
      search: this.search(),
      status: this.status(),
      page: this.page(),
      size: this.size(),
    }).subscribe(res => {
      this.patients.set(res.items);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
    this.load();
  }

  onStatus(value: PatientStatus | 'ALL'): void {
    this.status.set(value);
    this.page.set(0);
    this.load();
  }

  nextPage(): void {
    if (this.page() < this.totalPages() - 1) {
      this.page.update(p => p + 1);
      this.load();
    }
  }

  prevPage(): void {
    if (this.page() > 0) {
      this.page.update(p => p - 1);
      this.load();
    }
  }

  archive(patient: Patient): void {
    if (confirm(`Archiver le patient ${patient.firstName} ${patient.lastName} (${patient.patientNumber}) ?`)) {
      this.patientService.archive(patient.id).subscribe(() => this.load());
    }
  }

  initials(p: Patient): string {
    return (p.firstName[0] + p.lastName[0]).toUpperCase();
  }

  fullName(p: Patient): string {
    return `${p.firstName} ${p.lastName}`;
  }
}