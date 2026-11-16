import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideMail,
  LucidePhone,
  LucidePlus,
  LucidePower,
  LucideSearch,
} from '@lucide/angular';
import { StaffService } from '../staff.service';
import { Staff, StaffRole } from '../../../shared/models/staff.model';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    LucideSearch, LucidePlus, LucidePower, LucideMail, LucidePhone,
  ],
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.css'],
})
export class StaffListComponent implements OnInit {
  private readonly service = inject(StaffService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly staff = signal<Staff[]>([]);
  readonly search = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.list({ search: this.search() }).subscribe({
      next: items => {
        this.staff.set(items);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible de charger le personnel.');
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.load();
  }

  toggle(member: Staff): void {
    this.service.toggleActive(member.id).subscribe({
      next: () => this.load(),
      error: error => this.error.set(
        error instanceof Error ? error.message : 'Impossible de modifier le statut du membre.',
      ),
    });
  }

  roleLabel(role: StaffRole): string {
    const labels: Record<StaffRole, string> = {
      ADMIN: 'Administrateur',
      DENTIST: 'Dentiste',
      SECRETARY: 'Secrétaire',
      CASHIER: 'Caissier',
      STOCK_MANAGER: 'Gestionnaire stock',
      ASSISTANT: 'Assistant',
    };
    return labels[role];
  }

  roleClass(role: StaffRole): string {
    if (role === 'DENTIST') return 'dc-badge-info';
    if (role === 'ADMIN') return 'dc-badge-success';
    return 'dc-badge-warning';
  }

  initials(member: Staff): string {
    return `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase();
  }
}
