import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import {
  Appointment,
  AppointmentCreateDto,
  AppointmentStatus,
  AppointmentUpdateDto,
} from '../../shared/models/appointment.model';

const STORAGE_KEY = 'dc_appointments';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly _appointments = signal<Appointment[]>(this.loadFromStorage());

  readonly appointments = this._appointments.asReadonly();

  // ==========================================
  // LISTE + FILTRES
  // ==========================================
  list(params?: {
    from?: string;
    to?: string;
    dentistId?: string;
    patientId?: string;
    status?: AppointmentStatus | 'ALL';
  }): Observable<Appointment[]> {
    let items = [...this._appointments()];

    if (params?.from) {
      items = items.filter(a => a.startTime >= params.from!);
    }
    if (params?.to) {
      items = items.filter(a => a.startTime <= params.to!);
    }
    if (params?.dentistId) {
      items = items.filter(a => a.dentistId === params.dentistId);
    }
    if (params?.patientId) {
      items = items.filter(a => a.patientId === params.patientId);
    }
    if (params?.status && params.status !== 'ALL') {
      items = items.filter(a => a.status === params.status);
    }

    items.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return of(items).pipe(delay(200));
  }

  // ==========================================
  // DÉTAIL
  // ==========================================
  getById(id: string): Observable<Appointment | undefined> {
    return of(this._appointments().find(a => a.id === id)).pipe(delay(150));
  }

  // ==========================================
  // DÉTECTION DE CONFLIT
  // ==========================================
  hasConflict(
    dentistId: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): boolean {
    return this._appointments().some(a => {
      if (a.id === excludeId) return false;
      if (a.dentistId !== dentistId) return false;
      if (a.status === 'ANNULE' || a.status === 'ABSENT' || a.status === 'REPORTE') return false;
      // Chevauchement : (startA < endB) && (endA > startB)
      return a.startTime < endTime && a.endTime > startTime;
    });
  }

  checkConflict(
    dentistId: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Observable<boolean> {
    return of(this.hasConflict(dentistId, startTime, endTime, excludeId)).pipe(delay(150));
  }

  // ==========================================
  // CRÉATION
  // ==========================================
  create(dto: AppointmentCreateDto): Observable<Appointment> {
    if (this.hasConflict(dto.dentistId, dto.startTime, dto.endTime)) {
      return throwError(() => new Error(
        'Ce créneau chevauche un autre rendez-vous pour ce dentiste.',
      ));
    }

    const newAppointment: Appointment = {
      id: this.generateUuid(),
      patientId: dto.patientId,
      patientName: dto.patientName ?? dto.patientId,
      dentistId: dto.dentistId,
      dentistName: dto.dentistName ?? dto.dentistId,
      startTime: dto.startTime,
      endTime: dto.endTime,
      motif: dto.motif,
      status: 'EN_ATTENTE',
      observation: dto.observation,
      createdAt: new Date().toISOString(),
    };

    this._appointments.update(list => [...list, newAppointment]);
    this.saveToStorage();
    return of(newAppointment).pipe(delay(300));
  }

  // ==========================================
  // MISE À JOUR (correction appliquée)
  // ==========================================
  update(id: string, dto: AppointmentUpdateDto): Observable<Appointment> {
    const existing = this._appointments().find(a => a.id === id);
    if (!existing) {
      return throwError(() => new Error('Rendez-vous introuvable'));
    }

    // Si on modifie l'horaire ou le dentiste → vérifier conflit
    const newDentist = dto.dentistId ?? existing.dentistId;
    const newStart = dto.startTime ?? existing.startTime;
    const newEnd = dto.endTime ?? existing.endTime;

    if (
      (dto.dentistId || dto.startTime || dto.endTime) &&
      this.hasConflict(newDentist, newStart, newEnd, id)
    ) {
      return throwError(() => new Error(
        'Ce créneau chevauche un autre rendez-vous pour ce dentiste.',
      ));
    }

    // Construire la valeur finale AVANT mutation (évite inférence null)
    const patientUpdated: Appointment = {
      ...existing,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    this._appointments.update(list =>
      list.map(a => (a.id === id ? patientUpdated : a)),
    );
    this.saveToStorage();
    return of(patientUpdated).pipe(delay(300));
  }

  // ==========================================
  // CHANGEMENT DE STATUT
  // ==========================================
  changeStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    const existing = this._appointments().find(a => a.id === id);
    if (!existing) {
      return throwError(() => new Error('Rendez-vous introuvable'));
    }

    const updated: Appointment = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    this._appointments.update(list =>
      list.map(a => (a.id === id ? updated : a)),
    );
    this.saveToStorage();
    return of(updated).pipe(delay(200));
  }

  // ==========================================
  // SUPPRESSION (annulation)
  // ==========================================
  cancel(id: string): Observable<void> {
    this._appointments.update(list =>
      list.map(a =>
        a.id === id
          ? { ...a, status: 'ANNULE' as AppointmentStatus, updatedAt: new Date().toISOString() }
          : a,
      ),
    );
    this.saveToStorage();
    return of(void 0).pipe(delay(200));
  }

  // ==========================================
  // UTILITAIRES
  // ==========================================
  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private loadFromStorage(): Appointment[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const seed = this.getSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._appointments()));
  }

  // ==========================================
  // DONNÉES DÉMO — Aujourd'hui 16/11/2026
  // ==========================================
  private getSeedData(): Appointment[] {
    const today = new Date();
    const ymd = today.toISOString().slice(0, 10);

    return [
      {
        id: 'a1', patientId: 'p1', patientName: 'Aminata Diallo', patientNumber: 'PAT-2026-0001',
        dentistId: 'd1', dentistName: 'Dr. Omar Fall',
        startTime: `${ymd}T08:30:00`, endTime: `${ymd}T09:00:00`,
        motif: 'Détartrage', status: 'TERMINE', createdAt: new Date().toISOString(),
      },
      {
        id: 'a2', patientId: 'p2', patientName: 'Moussa Ndiaye', patientNumber: 'PAT-2026-0002',
        dentistId: 'd1', dentistName: 'Dr. Omar Fall',
        startTime: `${ymd}T09:15:00`, endTime: `${ymd}T10:00:00`,
        motif: 'Consultation', status: 'EN_CONSULTATION', createdAt: new Date().toISOString(),
      },
      {
        id: 'a3', patientId: 'p3', patientName: 'Fatou Sow', patientNumber: 'PAT-2026-0003',
        dentistId: 'd1', dentistName: 'Dr. Omar Fall',
        startTime: `${ymd}T10:30:00`, endTime: `${ymd}T11:15:00`,
        motif: 'Soins carie · dent 26', status: 'CONFIRME', createdAt: new Date().toISOString(),
      },
      {
        id: 'a4', patientId: 'p4', patientName: 'Ibrahima Ba', patientNumber: 'PAT-2026-0004',
        dentistId: 'd1', dentistName: 'Dr. Omar Fall',
        startTime: `${ymd}T11:30:00`, endTime: `${ymd}T12:00:00`,
        motif: 'Contrôle post-opératoire', status: 'CONFIRME', createdAt: new Date().toISOString(),
      },
      {
        id: 'a5', patientId: 'p5', patientName: 'Awa Diop', patientNumber: 'PAT-2026-0005',
        dentistId: 'd1', dentistName: 'Dr. Omar Fall',
        startTime: `${ymd}T14:00:00`, endTime: `${ymd}T14:45:00`,
        motif: 'Détartrage', status: 'EN_ATTENTE', createdAt: new Date().toISOString(),
      },
    ];
  }
}