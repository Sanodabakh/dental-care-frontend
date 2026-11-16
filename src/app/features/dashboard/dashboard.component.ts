import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight as ArrowRight,
  LucideCalendarDays as CalendarDays,
  LucideFileText as FileText,
  LucidePackage as Package,
  LucidePlus as Plus,
  LucideStethoscope as Stethoscope,
  LucideUsers as Users,
  LucideWallet as Wallet,
} from '@lucide/angular';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { LucideIconComponent } from '../../shared/components/lucide-icon/lucide-icon.component';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { DashboardService } from './dashboard.service';
import { DashboardStats } from '../../shared/models/dashboard.model';
import { Appointment } from '../../shared/models/appointment.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, LucideIconComponent, BaseChartDirective,
    StatCardComponent, FcfaPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly icons = {
    Users, CalendarDays, Stethoscope, Wallet, FileText, Package, Plus, ArrowRight,
  };

  // ============ ÉTATS ============
  readonly loading = signal(true);
  readonly stats = signal<DashboardStats | null>(null);
  readonly appointments = signal<Appointment[]>([]);

  readonly todayLabel = computed(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date());
  });

  // ============ GRAPHIQUES ============
  revenueChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  appointmentChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  readonly barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#253449',
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { display: false },
        grid: { display: false },
        border: { display: false },
      },
      x: {
        ticks: { color: '#92A0AE', font: { size: 10 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  readonly appointmentStatusCounts = computed(() => {
    const appointments = this.appointments();
    return {
      completed: appointments.filter(({ status }) => status === 'TERMINE').length,
      confirmed: appointments.filter(({ status }) => status === 'CONFIRME').length,
      planned: appointments.filter(({ status }) => status === 'EN_ATTENTE').length,
    };
  });

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe(stats => {
      this.stats.set(stats);
      this.loading.set(false);
    });

    this.appointments.set(this.dashboardService.getTodayAppointments());
    this.buildCharts();
  }

  private buildCharts(): void {
    const revenue = this.dashboardService.getRevenueData();
    this.revenueChartData = {
      labels: revenue.map(r => r.label),
      datasets: [{
        data: revenue.map(r => r.value),
        backgroundColor: revenue.map((_, index) =>
          index === revenue.length - 1 ? '#478FC7' : '#F0F4F7',
        ),
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 30,
      }],
    };

    const appointmentActivity = this.dashboardService.getAppointmentActivityData();
    this.appointmentChartData = {
      labels: appointmentActivity.map(point => point.month),
      datasets: [{
        data: appointmentActivity.map(point => point.count),
        backgroundColor: appointmentActivity.map((_, index) =>
          index === appointmentActivity.length - 1 ? '#39B3A9' : '#F0F4F7',
        ),
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 30,
      }],
    };
  }

  // ============ HELPERS ============
  initials(name: string | undefined): string {
    if (!name) return '?';
    return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      EN_ATTENTE: 'En attente',
      CONFIRME: 'Confirmé',
      ARRIVE: 'Arrivé',
      EN_CONSULTATION: 'En consultation',
      TERMINE: 'Terminé',
      ANNULE: 'Annulé',
      ABSENT: 'Absent',
      REPORTE: 'Reporté',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    if (['CONFIRME', 'ARRIVE', 'TERMINE'].includes(status)) return 'dc-badge-success';
    if (['EN_ATTENTE', 'REPORTE'].includes(status)) return 'dc-badge-warning';
    if (['ANNULE', 'ABSENT'].includes(status)) return 'dc-badge-danger';
    return 'dc-badge-info';
  }
}