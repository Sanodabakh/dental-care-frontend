import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import {
  Consultation, ConsultationCreateDto, ConsultationStatus,
} from '../../shared/models/consultation.model';

const STORAGE_KEY = 'dc_consultations';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private readonly _consultations = signal<Consultation[]>(this.loadFromStorage());
  readonly consultations = this._consultations.asReadonly();

  list(params?: { patientId?: string }): Observable<Consultation[]> {
    let items = [...this._consultations()];
    if (params?.patientId) {
      items = items.filter(c => c.patientId === params.patientId);
    }
    items.sort((a, b) => b.consultationDate.localeCompare(a.consultationDate));
    return of(items).pipe(delay(200));
  }

  getById(id: string): Observable<Consultation | undefined> {
    return of(this._consultations().find(c => c.id === id)).pipe(delay(150));
  }

  create(dto: ConsultationCreateDto): Observable<Consultation> {
    const newConsultation: Consultation = {
      id: this.generateUuid(),
      patientId: dto.patientId,
      patientNumber: dto.patientNumber,
      patientName: '',
      dentistId: dto.dentistId,
      dentistName: '',
      consultationDate: new Date().toISOString(),
      symptoms: dto.symptoms,
      clinicalExam: dto.clinicalExam,
      diagnosis: dto.diagnosis,
      treatmentPlan: dto.treatmentPlan,
      observations: dto.observations,
      status: 'BROUILLON',
      createdAt: new Date().toISOString(),
    };
    this._consultations.update(list => [newConsultation, ...list]);
    this.saveToStorage();
    return of(newConsultation).pipe(delay(300));
  }

  validate(id: string): Observable<Consultation> {
    const existing = this._consultations().find(c => c.id === id);
    if (!existing) return throwError(() => new Error('Consultation introuvable'));

    const updated: Consultation = {
      ...existing,
      status: 'VALIDEE' as ConsultationStatus,
      validatedAt: new Date().toISOString(),
    };
    this._consultations.update(list => list.map(c => c.id === id ? updated : c));
    this.saveToStorage();
    return of(updated).pipe(delay(200));
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private loadFromStorage(): Consultation[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._consultations()));
  }
}