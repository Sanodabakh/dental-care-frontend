import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { apiError } from '../../core/services/api-error';
import {
  DentalObservation, ToothCondition, ToothState, ToothSurface,
} from '../../shared/models/odontogram.model';

interface ObservationDto {
  id: string;
  patientId: string;
  toothNumber: string;
  surface?: string;
  condition: ToothCondition;
  observation?: string;
  consultationId?: string;
  createdBy: string;
  createdAt: string;
}

interface ToothStateDto {
  toothNumber: string;
  condition: ToothCondition;
  surface?: string;
  observation?: string;
  updatedAt: string;
}

interface OdontogramDto {
  patientId: string;
  teeth: ToothStateDto[];
}

@Injectable({ providedIn: 'root' })
export class OdontogramService {
  constructor(private api: ApiService) {}

  getToothStates(patientId: string): Observable<ToothState[]> {
    return this.api.get<OdontogramDto>(`/odontograms/${patientId}`).pipe(
      map(odontogram => odontogram.teeth.map(tooth => ({
        toothNumber: tooth.toothNumber,
        currentCondition: tooth.condition,
        surfaces: {},
        history: [],
      } as ToothState))),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getObservationsForPatient(patientId: string): Observable<DentalObservation[]> {
    return this.getToothStates(patientId).pipe(
      map(states => states.map(state => ({
        id: `state-${state.toothNumber}`,
        patientId,
        patientNumber: '',
        toothNumber: state.toothNumber,
        condition: state.currentCondition,
        surface: undefined,
        observation: undefined,
        createdBy: '',
        createdAt: new Date().toISOString(),
      } as DentalObservation))),
      catchError(() => of([])),
    );
  }

  getToothHistory(patientId: string, toothNumber: string): Observable<DentalObservation[]> {
    return this.api.get<ObservationDto[]>(`/odontograms/${patientId}/teeth/${toothNumber}`).pipe(
      map(items => items.map(item => this.toObservation(item, patientId))),
      catchError(() => of([])),
    );
  }

  addObservation(obs: Omit<DentalObservation, 'id' | 'createdAt'>): Observable<DentalObservation> {
    return this.api.post<ObservationDto>('/odontograms', {
      patientId: obs.patientId,
      toothNumber: obs.toothNumber,
      surface: obs.surface,
      condition: obs.condition,
      observation: obs.observation,
      consultationId: obs.consultationId,
    }).pipe(
      map(item => this.toObservation(item, obs.patientId)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  private toObservation(item: ObservationDto, patientId: string): DentalObservation {
    return {
      id: item.id,
      patientId: item.patientId ?? patientId,
      patientNumber: '',
      toothNumber: item.toothNumber,
      surface: item.surface as ToothSurface | undefined,
      condition: item.condition,
      observation: item.observation,
      consultationId: item.consultationId,
      createdBy: item.createdBy,
      createdAt: item.createdAt,
    };
  }
}
