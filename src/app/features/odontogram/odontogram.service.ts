import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  DentalObservation, ToothCondition, ToothState, ToothSurface,
} from '../../shared/models/odontogram.model';

const STORAGE_KEY = 'dc_dental_observations';

@Injectable({ providedIn: 'root' })
export class OdontogramService {
  private readonly _observations = signal<DentalObservation[]>(this.loadFromStorage());

  getObservationsForPatient(patientId: string): Observable<DentalObservation[]> {
    return of(this._observations().filter(o => o.patientId === patientId)).pipe(delay(200));
  }

  getToothHistory(patientId: string, toothNumber: string): Observable<DentalObservation[]> {
    const history = this._observations()
      .filter(o => o.patientId === patientId && o.toothNumber === toothNumber)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return of(history).pipe(delay(150));
  }

  getToothStates(patientId: string): Observable<ToothState[]> {
    const observations = this._observations().filter(o => o.patientId === patientId);
    const byTooth = new Map<string, DentalObservation[]>();

    observations.forEach(o => {
      if (!byTooth.has(o.toothNumber)) byTooth.set(o.toothNumber, []);
      byTooth.get(o.toothNumber)!.push(o);
    });

    const states: ToothState[] = [];
    byTooth.forEach((obs, toothNumber) => {
      const latest = obs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      states.push({
        toothNumber,
        currentCondition: latest.condition,
        surfaces: {},
        history: obs,
      });
    });

    return of(states).pipe(delay(200));
  }

  addObservation(obs: Omit<DentalObservation, 'id' | 'createdAt'>): Observable<DentalObservation> {
    const newObs: DentalObservation = {
      ...obs,
      id: this.generateUuid(),
      createdAt: new Date().toISOString(),
    };
    this._observations.update(list => [newObs, ...list]);
    this.saveToStorage();
    return of(newObs).pipe(delay(200));
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private loadFromStorage(): DentalObservation[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._observations()));
  }
}