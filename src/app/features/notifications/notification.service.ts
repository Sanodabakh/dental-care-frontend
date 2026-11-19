import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { apiError } from '../../core/services/api-error';
import { PatientService } from '../patients/patient.service';
import {
  Notification, NotificationCreateDto,
} from '../../shared/models/notification.model';

interface NotificationDto {
  id: string;
  patientId: string;
  type: Notification['type'];
  channel: Notification['channel'];
  message: string;
  status: Notification['status'];
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private api: ApiService, private patientService: PatientService) {}

  list(params?: { patientId?: string }): Observable<Notification[]> {
    return forkJoin({
      page: this.api.getPage<NotificationDto>('/notifications', {
        size: 200,
        patientId: params?.patientId,
      }),
      patients: this.patientService.listAll().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ page, patients }) => {
        const byId = new Map(patients.map(patient => [patient.id, patient] as const));
        return page.items.map(item => {
          const patient = byId.get(item.patientId);
          return {
            ...item,
            patientNumber: patient?.patientNumber,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined,
            patientPhone: patient?.phone,
          } as Notification;
        });
      }),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  send(dto: NotificationCreateDto): Observable<Notification> {
    return this.api.post<NotificationDto>('/notifications', {
      patientId: dto.patientId,
      type: dto.type,
      channel: dto.channel,
      message: dto.message,
    }).pipe(
      switchMap(created => this.api.post<NotificationDto>(`/notifications/${created.id}/send`, {})),
      map(item => item as Notification),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  /** Relance une notification restée en attente (le backend refuse les autres statuts). */
  retry(id: string): Observable<Notification> {
    return this.api.post<NotificationDto>(`/notifications/${id}/send`, {}).pipe(
      map(item => item as Notification),
      catchError(error => throwError(() => apiError(error))),
    );
  }
}
