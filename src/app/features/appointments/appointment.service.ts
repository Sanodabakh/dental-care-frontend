import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { apiError } from '../../core/services/api-error';
import { DirectoryService } from '../../core/services/directory.service';
import { PatientService } from '../patients/patient.service';
import { User } from '../../shared/models/user.model';
import {
  Appointment, AppointmentCreateDto, AppointmentStatus, AppointmentUpdateDto,
} from '../../shared/models/appointment.model';

interface AppointmentDto {
  id: string;
  patientId: string;
  dentistId: string;
  startTime: string;
  endTime: string;
  motif: string;
  status: AppointmentStatus;
  observation?: string;
  createdAt: string;
  updatedAt?: string;
}

const TERMINAL: AppointmentStatus[] = ['ANNULE', 'ABSENT', 'REPORTE'];

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(
    private api: ApiService,
    private patientService: PatientService,
    private directory: DirectoryService,
  ) {}

  dentists(): Observable<User[]> {
    return this.directory.dentists().pipe(catchError(() => of([])));
  }

  list(params?: {
    from?: string;
    to?: string;
    date?: string;
    dentistId?: string;
    patientId?: string;
    status?: AppointmentStatus | 'ALL';
  }): Observable<Appointment[]> {
    return forkJoin({
      page: this.api.getPage<AppointmentDto>('/appointments', {
        from: params?.from?.slice(0, 10),
        to: params?.to?.slice(0, 10),
        date: params?.date,
        dentistId: params?.dentistId || undefined,
        patientId: params?.patientId || undefined,
        status: params?.status && params.status !== 'ALL' ? params.status : undefined,
        size: 1000,
      }),
      patients: this.patientService.listAll().pipe(catchError(() => of([]))),
      dentists: this.dentists(),
    }).pipe(
      map(({ page, patients, dentists }) => {
        const byId = new Map(patients.map(patient => [patient.id, patient] as const));
        const dentistsById = new Map(dentists.map(user => [user.id, user] as const));
        return page.items.map(item => {
          const patient = byId.get(item.patientId);
          return {
            ...item,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined,
            patientNumber: patient?.patientNumber,
            dentistName: dentistsById.get(item.dentistId)?.fullName,
          } as Appointment;
        });
      }),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getById(id: string): Observable<Appointment> {
    return this.api.get<AppointmentDto>(`/appointments/${id}`).pipe(
      map(item => item as Appointment),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  checkConflict(
    dentistId: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Observable<boolean> {
    const day = startTime.slice(0, 10);
    return this.list({ dentistId, date: day }).pipe(
      map(items => items.some(item => {
        if (item.id === excludeId) return false;
        if (item.dentistId !== dentistId) return false;
        if (TERMINAL.includes(item.status)) return false;
        return item.startTime < endTime && item.endTime > startTime;
      })),
      catchError(() => of(false)),
    );
  }

  create(dto: AppointmentCreateDto): Observable<Appointment> {
    return this.api.post<AppointmentDto>('/appointments', {
      patientId: dto.patientId,
      dentistId: dto.dentistId,
      startTime: dto.startTime,
      endTime: dto.endTime,
      motif: dto.motif,
      observation: dto.observation,
    }).pipe(
      map(item => item as Appointment),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  update(id: string, dto: AppointmentUpdateDto): Observable<Appointment> {
    return this.getById(id).pipe(
      switchMap(existing => this.api.put<AppointmentDto>(`/appointments/${id}`, {
        patientId: dto.patientId ?? existing.patientId,
        dentistId: dto.dentistId ?? existing.dentistId,
        startTime: dto.startTime ?? existing.startTime,
        endTime: dto.endTime ?? existing.endTime,
        motif: dto.motif ?? existing.motif,
        observation: dto.observation ?? existing.observation,
      })),
      map(item => item as Appointment),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  changeStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    return this.api.patch<AppointmentDto>(`/appointments/${id}/status`, { status }).pipe(
      map(item => item as Appointment),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  cancel(id: string): Observable<void> {
    return this.api.delete<AppointmentDto>(`/appointments/${id}`).pipe(
      map(() => void 0),
      catchError(error => throwError(() => apiError(error))),
    );
  }
}
