import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideBell as Bell,
  LucideChevronDown as ChevronDown,
  LucideChevronRight as ChevronRight,
  LucideLogOut as LogOut,
  LucideMenu as Menu,
  LucideSearch as Search,
  LucideSettings as Settings,
} from '@lucide/angular';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { PatientService } from '../../../features/patients/patient.service';
import { Patient } from '../../../shared/models/patient.model';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideIconComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  readonly icons = { Search, Bell, ChevronDown, ChevronRight, LogOut, Settings, Menu };
  private readonly router = inject(Router);
  private readonly patientService = inject(PatientService);
  readonly auth = inject(AuthService);

  readonly query = signal('');
  readonly menuOpen = signal(false);
  readonly results = signal<Patient[]>([]);
  readonly searching = signal(false);
  readonly showResults = signal(false);

  private readonly searchTerms = new Subject<string>();

  constructor() {
    this.searchTerms.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(term => {
        const value = term.trim();
        if (value.length < 2) {
          this.searching.set(false);
          return of([] as Patient[]);
        }
        this.searching.set(true);
        return this.patientService.list({ search: value, page: 0, size: 6 }).pipe(
          map(result => result.items),
          catchError(() => of([] as Patient[])),
        );
      }),
    ).subscribe(items => {
      this.results.set(items);
      this.searching.set(false);
    });
  }

  get currentPage(): string {
    const section = this.router.url.split(/[?#]/)[0].split('/')[1] || '';
    const titles: Record<string, string> = {
      appointments: 'Rendez-vous',
      consultations: 'Consultations',
      dashboard: "Vue d'ensemble",
      odontogram: 'Odontogrammes',
      patients: 'Patients',
    };
    return titles[section] ?? "Vue d'ensemble";
  }

  toggleMenu(): void { this.menuOpen.update(v => !v); }
  logout(): void { this.menuOpen.set(false); this.auth.logout(); }

  initials(name: string | undefined): string {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    this.showResults.set(true);
    this.searchTerms.next(value);
  }

  /** Ouvre directement la fiche du patient sélectionné. */
  selectPatient(patient: Patient): void {
    this.showResults.set(false);
    this.query.set('');
    this.results.set([]);
    this.router.navigate(['/patients', patient.id]);
  }

  /** Entrée : fiche directe si un seul résultat, sinon liste filtrée. */
  submitSearch(): void {
    const value = this.query().trim();
    if (!value) {
      return;
    }
    if (this.results().length === 1) {
      this.selectPatient(this.results()[0]);
      return;
    }
    this.showResults.set(false);
    this.router.navigate(['/patients'], { queryParams: { search: value } });
  }

  closeResults(): void {
    setTimeout(() => this.showResults.set(false), 150);
  }
}
