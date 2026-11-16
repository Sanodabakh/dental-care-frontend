import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideCalendarDays as CalendarDays,
  LucideChevronLeft as ChevronLeft,
  LucideChevronRight as ChevronRight,
  LucidePlus as Plus,
} from '@lucide/angular';
import { AppointmentService } from '../appointment.service';
import { Appointment } from '../../../shared/models/appointment.model';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

type ViewMode = 'day' | 'week' | 'month' | 'list';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideIconComponent, DateFrPipe],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit {
  private readonly appointmentService = inject(AppointmentService);

  readonly icons = { ChevronLeft, ChevronRight, Plus, CalendarDays };

  readonly viewMode = signal<ViewMode>('day');
  readonly currentDate = signal<Date>(new Date());
  readonly loading = signal(true);
  readonly appointments = signal<Appointment[]>([]);

  // ============ FILTRES
  readonly statusFilter = signal<string>('ALL');

  // ============ LABELS
  readonly currentDateLabel = computed(() => {
    const d = this.currentDate();
    switch (this.viewMode()) {
      case 'day':
        return new Intl.DateTimeFormat('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        }).format(d);
      case 'week':
        const start = this.startOfWeek(d);
        const end = this.endOfWeek(d);
        return `${start.getDate()} – ${end.getDate()} ${new Intl.DateTimeFormat('fr-FR', {
          month: 'long', year: 'numeric',
        }).format(end)}`;
      case 'month':
        return new Intl.DateTimeFormat('fr-FR', {
          month: 'long', year: 'numeric',
        }).format(d);
      default:
        return new Intl.DateTimeFormat('fr-FR', {
          month: 'long', year: 'numeric',
        }).format(d);
    }
  });

  // ============ GRILLE HORAIRE (8h - 19h)
  readonly hours = Array.from({ length: 12 }, (_, i) => i + 8);

  // ============ SEMAINE EN COURS
  readonly weekDays = computed(() => {
    const start = this.startOfWeek(this.currentDate());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  });

  // ============ MOIS EN COURS
  readonly monthGrid = computed(() => {
    const d = this.currentDate();
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const startOffset = (first.getDay() + 6) % 7; // lundi=0
    const totalDays = last.getDate();
    const cells: { date: Date | null; inMonth: boolean; today: boolean }[] = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, inMonth: false, today: false });
    }
    const todayStr = new Date().toDateString();
    for (let i = 1; i <= totalDays; i++) {
      const dt = new Date(d.getFullYear(), d.getMonth(), i);
      cells.push({ date: dt, inMonth: true, today: dt.toDateString() === todayStr });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, inMonth: false, today: false });
    return cells;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const { from, to } = this.getRangeForView();
    this.appointmentService.list({
      from,
      to,
      status: this.statusFilter() as any,
    }).subscribe(items => {
      this.appointments.set(items);
      this.loading.set(false);
    });
  }

  setView(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.load();
  }

  navigate(direction: -1 | 1): void {
    const d = new Date(this.currentDate());
    switch (this.viewMode()) {
      case 'day':   d.setDate(d.getDate() + direction); break;
      case 'week':  d.setDate(d.getDate() + direction * 7); break;
      case 'month': d.setMonth(d.getMonth() + direction); break;
      default:      d.setDate(d.getDate() + direction); break;
    }
    this.currentDate.set(d);
    this.load();
  }

  goToday(): void {
    this.currentDate.set(new Date());
    this.load();
  }

  // ============ GRILLE JOUR
  appointmentsForHour(day: Date, hour: number): Appointment[] {
    return this.appointments().filter(a => {
      const dt = new Date(a.startTime);
      return dt.toDateString() === day.toDateString() && dt.getHours() === hour;
    });
  }

  appointmentsForDay(day: Date): Appointment[] {
    return this.appointments().filter(a => {
      const dt = new Date(a.startTime);
      return dt.toDateString() === day.toDateString();
    });
  }

  // ============ ACTIONS
  changeStatus(appt: Appointment, status: any): void {
    this.appointmentService.changeStatus(appt.id, status).subscribe(() => this.load());
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'En attente', CONFIRME: 'Confirmé', ARRIVE: 'Arrivé',
      EN_CONSULTATION: 'En consultation', TERMINE: 'Terminé',
      ANNULE: 'Annulé', ABSENT: 'Absent', REPORTE: 'Reporté',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    if (['CONFIRME', 'ARRIVE', 'TERMINE'].includes(status)) return 'dc-badge-success';
    if (['EN_ATTENTE', 'REPORTE'].includes(status)) return 'dc-badge-warning';
    if (['ANNULE', 'ABSENT'].includes(status)) return 'dc-badge-danger';
    return 'dc-badge-info';
  }

  blockColorClass(status: string): string {
    if (status === 'TERMINE') return 'block-done';
    if (status === 'EN_CONSULTATION') return 'block-progress';
    if (status === 'CONFIRME') return 'block-confirmed';
    if (status === 'EN_ATTENTE') return 'block-waiting';
    if (status === 'ANNULE' || status === 'ABSENT') return 'block-cancelled';
    return 'block-default';
  }

  initials(name: string | undefined): string {
    if (!name) return '?';
    return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  }

  timeOnly(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  // ============ HELPERS
  private startOfWeek(d: Date): Date {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private endOfWeek(d: Date): Date {
    const date = this.startOfWeek(d);
    date.setDate(date.getDate() + 6);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private getRangeForView(): { from: string; to: string } {
    const mode = this.viewMode();
    const d = this.currentDate();
    if (mode === 'day') {
      const s = new Date(d); s.setHours(0, 0, 0, 0);
      const e = new Date(d); e.setHours(23, 59, 59, 999);
      return { from: s.toISOString(), to: e.toISOString() };
    }
    if (mode === 'week') {
      return { from: this.startOfWeek(d).toISOString(), to: this.endOfWeek(d).toISOString() };
    }
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from: first.toISOString(), to: last.toISOString() };
  }
}