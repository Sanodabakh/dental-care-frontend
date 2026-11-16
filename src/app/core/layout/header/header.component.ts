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
import { AuthService } from '../../auth/auth.service';
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
  readonly auth = inject(AuthService);
  readonly query = signal('');
  readonly menuOpen = signal(false);

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
}