import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { apiError } from '../../core/services/api-error';
import { PatientService } from '../patients/patient.service';
import { AppointmentService } from '../appointments/appointment.service';
import { DashboardStats } from '../../shared/models/dashboard.model';
import { Appointment } from '../../shared/models/appointment.model';
import { Patient } from '../../shared/models/patient.model';

export interface RevenuePoint { label: string; value: number; }
export interface AppointmentActivityPoint { month: string; count: number; }

interface DashboardStatsDto {
  patientsActifs: number;
  rendezVousAujourdhui: number;
  rendezVousAvenir7Jours: number;
  consultationsMois: number;
  encaisseAujourdhuiFcfa: number;
  encaisseMoisFcfa: number;
  impayesFcfa: number;
  produitsStockBas: number;
}

interface RevenuePointDto { period: string; amountFcfa: number; }

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private api: ApiService,
    private patientService: PatientService,
    private appointmentService: AppointmentService,
  ) {}

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      stats: this.api.get<DashboardStatsDto>('/dashboard/stats'),
      patients: this.patientService.listAll().pipe(catchError(() => of([] as Patient[]))),
    }).pipe(
      map(({ stats, patients }) => ({
        totalPatients: stats.patientsActifs,
        newPatientsMonth: this.countPatientsThisMonth(patients),
        todayAppointments: stats.rendezVousAujourdhui,
        todayConsultations: stats.consultationsMois,
        todayRevenueFcfa: stats.encaisseAujourdhuiFcfa,
        monthRevenueFcfa: stats.encaisseMoisFcfa,
        unpaidInvoices: stats.impayesFcfa,
        lowStockProducts: stats.produitsStockBas,
      })),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getTodayAppointments(): Observable<Appointment[]> {
    return this.appointmentService.list({ date: new Date().toISOString().slice(0, 10) })
      .pipe(catchError(() => of([] as Appointment[])));
  }

  getRevenueData(): Observable<RevenuePoint[]> {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth() - 5, 1);
    return this.api.get<RevenuePointDto[]>('/reports/revenue', {
      from: this.ymd(from),
      to: this.ymd(to),
      group: 'MONTH',
    }).pipe(
      map(points => points.map(point => ({
        label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(`${point.period}-01T00:00:00`)),
        value: point.amountFcfa,
      }))),
      catchError(() => of([] as RevenuePoint[])),
    );
  }

  getAppointmentActivityData(): Observable<AppointmentActivityPoint[]> {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth() - 5, 1);
    return this.appointmentService.list({ from: this.ymd(from), to: this.ymd(to) }).pipe(
      map(appointments => {
        const counts = new Map<string, number>();
        for (const appointment of appointments) {
          const key = appointment.startTime.slice(0, 7);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return Array.from({ length: 6 }, (_, index) => {
          const date = new Date(to.getFullYear(), to.getMonth() - 5 + index, 1);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return {
            month: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date),
            count: counts.get(key) ?? 0,
          };
        });
      }),
      catchError(() => of([] as AppointmentActivityPoint[])),
    );
  }

  private countPatientsThisMonth(patients: Patient[]): number {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return patients.filter(patient => (patient.createdAt ?? '').slice(0, 7) === prefix).length;
  }

  private ymd(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
