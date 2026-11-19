import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { apiError } from '../../core/services/api-error';
import {
  Patient, PatientCreateDto, PatientUpdateDto, PatientStatus,
} from '../../shared/models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  constructor(private api: ApiService) {}

  list(params?: {
    search?: string;
    status?: PatientStatus | 'ALL';
    page?: number;
    size?: number;
  }): Observable<{ items: Patient[]; total: number }> {
    return this.api.getPage<Patient>('/patients', {
      search: params?.search?.trim() || undefined,
      status: params?.status && params.status !== 'ALL' ? params.status : undefined,
      page: params?.page ?? 0,
      size: params?.size ?? 10,
    }).pipe(
      map(page => ({ items: page.items, total: page.total })),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  /** Tous les patients (utile pour enrichir les listes d'autres modules). */
  listAll(): Observable<Patient[]> {
    return this.api.getPage<Patient>('/patients', { size: 1000 }).pipe(
      map(page => page.items),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getById(id: string): Observable<Patient> {
    return this.api.get<Patient>(`/patients/${id}`)
      .pipe(catchError(error => throwError(() => apiError(error))));
  }

  getByNumber(patientNumber: string): Observable<Patient> {
    return this.api.get<Patient>(`/patients/number/${encodeURIComponent(patientNumber)}`)
      .pipe(catchError(error => throwError(() => apiError(error))));
  }

  create(dto: PatientCreateDto): Observable<Patient> {
    return this.api.post<Patient>('/patients', dto)
      .pipe(catchError(error => throwError(() => apiError(error))));
  }

  update(id: string, dto: PatientUpdateDto): Observable<Patient> {
    return this.api.put<Patient>(`/patients/${id}`, dto)
      .pipe(catchError(error => throwError(() => apiError(error))));
  }

  archive(id: string): Observable<void> {
    return this.api.post<Patient>(`/patients/${id}/archive`, {})
      .pipe(
        map(() => void 0),
        catchError(error => throwError(() => apiError(error))),
      );
  }
}
