import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { DashboardStats } from '../../shared/models/dashboard.model';
import { Appointment } from '../../shared/models/appointment.model';
import { Patient } from '../../shared/models/patient.model';

export interface RevenuePoint { label: string; value: number; }
export interface ConsultationPoint { month: string; count: number; }
export interface AppointmentActivityPoint { month: string; count: number; }
export interface ActDistribution { label: string; value: number; color: string; }
export interface PaymentDistribution { label: string; value: number; color: string; }
export interface StockAlert { product: string; remaining: number; unit: string; }
export interface RecentActivity { type: string; message: string; time: string; }

@Injectable({ providedIn: 'root' })
export class DashboardService {

  // ============ STATISTIQUES GLOBALES ============
  getStats(): Observable<DashboardStats> {
    return of({
      totalPatients: 1284,
      newPatientsMonth: 18,
      todayAppointments: 8,
      todayConsultations: 6,
      todayRevenueFcfa: 485000,
      monthRevenueFcfa: 2845000,
      unpaidInvoices: 4,
      lowStockProducts: 3,
    }).pipe(delay(300));
  }

  // ============ GRAPHIQUE RECETTES (6 mois) ============
  getRevenueData(): RevenuePoint[] {
    return [
      { label: 'Juin', value: 1800000 },
      { label: 'Juil.', value: 2200000 },
      { label: 'Août', value: 2050000 },
      { label: 'Sept.', value: 2600000 },
      { label: 'Oct.', value: 2300000 },
      { label: 'Nov.', value: 2845000 },
    ];
  }

  getAppointmentActivityData(): AppointmentActivityPoint[] {
    return [
      { month: 'Juin', count: 42 },
      { month: 'Juil.', count: 38 },
      { month: 'Août', count: 51 },
      { month: 'Sept.', count: 47 },
      { month: 'Oct.', count: 63 },
      { month: 'Nov.', count: 58 },
    ];
  }

  // ============ GRAPHIQUE CONSULTATIONS (6 mois) ============
  getConsultationsData(): ConsultationPoint[] {
    return [
      { month: 'Juin',  count: 42 },
      { month: 'Juil',  count: 38 },
      { month: 'Août',  count: 51 },
      { month: 'Sept',  count: 47 },
      { month: 'Oct',   count: 63 },
      { month: 'Nov',   count: 58 },
    ];
  }

  // ============ RÉPARTITION ACTES ============
  getActDistribution(): ActDistribution[] {
    return [
      { label: 'Soins carie',    value: 34, color: '#1769AA' },
      { label: 'Détartrage',     value: 22, color: '#17A6A1' },
      { label: 'Extractions',    value: 15, color: '#8b83d5' },
      { label: 'Couronnes',      value: 12, color: '#f0ad4e' },
      { label: 'Consultations',  value: 17, color: '#dc7c5a' },
    ];
  }

  // ============ RÉPARTITION PAIEMENTS ============
  getPaymentDistribution(): PaymentDistribution[] {
    return [
      { label: 'Espèces',      value: 45, color: '#1769AA' },
      { label: 'Wave',         value: 25, color: '#17A6A1' },
      { label: 'Orange Money', value: 18, color: '#f0ad4e' },
      { label: 'Virement',     value: 8,  color: '#8b83d5' },
      { label: 'Carte',        value: 4,  color: '#dc7c5a' },
    ];
  }

  // ============ RENDEZ-VOUS DU JOUR ============
  getTodayAppointments(): Appointment[] {
    return [
      { id: '1', patientId: 'p1', patientName: 'Aminata Diallo', dentistId: 'd1',
        startTime: '08:30', endTime: '09:00', motif: 'Détartrage',
        status: 'TERMINE', createdAt: '' },
      { id: '2', patientId: 'p2', patientName: 'Moussa Ndiaye', dentistId: 'd1',
        startTime: '09:15', endTime: '10:00', motif: 'Consultation',
        status: 'EN_CONSULTATION', createdAt: '' },
      { id: '3', patientId: 'p3', patientName: 'Fatou Sow', dentistId: 'd1',
        startTime: '10:30', endTime: '11:15', motif: 'Soins carie · dent 26',
        status: 'CONFIRME', createdAt: '' },
      { id: '4', patientId: 'p4', patientName: 'Ibrahima Ba', dentistId: 'd1',
        startTime: '11:30', endTime: '12:00', motif: 'Contrôle post-opératoire',
        status: 'CONFIRME', createdAt: '' },
      { id: '5', patientId: 'p5', patientName: 'Awa Diop', dentistId: 'd1',
        startTime: '14:00', endTime: '14:45', motif: 'Détartrage',
        status: 'EN_ATTENTE', createdAt: '' },
    ];
  }

  // ============ DERNIERS PATIENTS ============
  getRecentPatients(): Patient[] {
    return [
      { id: 'p1', patientNumber: 'PAT-2024-0842', firstName: 'Aminata', lastName: 'Diallo',
        phone: '77 123 45 67', gender: 'F', createdAt: '2024-11-14',
        lastConsultation: '2024-11-14', status: 'ACTIF' },
      { id: 'p2', patientNumber: 'PAT-2024-0839', firstName: 'Moussa', lastName: 'Ndiaye',
        phone: '76 234 56 78', gender: 'M', createdAt: '2024-11-13',
        lastConsultation: '2024-11-10', status: 'ACTIF' },
      { id: 'p3', patientNumber: 'PAT-2024-0835', firstName: 'Fatou', lastName: 'Sow',
        phone: '78 345 67 89', gender: 'F', createdAt: '2024-11-12',
        lastConsultation: '2024-11-12', status: 'ACTIF' },
      { id: 'p4', patientNumber: 'PAT-2024-0828', firstName: 'Ibrahima', lastName: 'Ba',
        phone: '70 456 78 90', gender: 'M', createdAt: '2024-11-10',
        lastConsultation: '2024-11-08', status: 'ACTIF' },
    ];
  }

  // ============ ALERTES STOCK ============
  getStockAlerts(): StockAlert[] {
    return [
      { product: 'Gants nitrile', remaining: 3, unit: 'boîtes' },
      { product: 'Anesthésiques', remaining: 5, unit: 'flacons' },
      { product: 'Compresses', remaining: 8, unit: 'paquets' },
    ];
  }

  // ============ ACTIVITÉ RÉCENTE ============
  getRecentActivity(): RecentActivity[] {
    return [
      { type: 'patient', message: 'Nouveau patient : Aminata Diallo', time: 'Il y a 12 min' },
      { type: 'invoice', message: 'Facture FAC-2024-0091 validée — 45 000 FCFA', time: 'Il y a 35 min' },
      { type: 'payment', message: 'Paiement reçu : 40 000 FCFA (Wave)', time: 'Il y a 1h' },
      { type: 'appointment', message: 'Rendez-vous reporté : Ibrahima Ba', time: 'Il y a 2h' },
      { type: 'stock', message: 'Alerte stock : gants nitrile', time: 'Il y a 3h' },
    ];
  }
}