import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { apiError } from '../../core/services/api-error';
import { PatientService } from '../patients/patient.service';
import {
  Consultation, ConsultationCreateDto, ConsultationStatus,
} from '../../shared/models/consultation.model';

interface ConsultationDto {
  id: string;
  patientId: string;
  dentistId: string;
  appointmentId?: string;
  consultationDate: string;
  symptoms?: string;
  clinicalExam?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  observations?: string;
  status: ConsultationStatus;
  validatedAt?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  constructor(private api: ApiService, private patientService: PatientService) {}

  list(params?: { patientId?: string }): Observable<Consultation[]> {
    return forkJoin({
      page: this.api.getPage<ConsultationDto>('/consultations', {
        patientId: params?.patientId,
        size: 1000,
      }),
      patients: this.patientService.listAll().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ page, patients }) => {
        const byId = new Map(patients.map(patient => [patient.id, patient] as const));
        return page.items.map(item => {
          const patient = byId.get(item.patientId);
          return {
            ...item,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
            patientNumber: patient?.patientNumber ?? '',
            dentistName: '',
          } as Consultation;
        });
      }),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getById(id: string): Observable<Consultation> {
    return this.api.get<ConsultationDto>(`/consultations/${id}`).pipe(
      map(item => ({ ...item, patientName: '', patientNumber: '', dentistName: '' } as Consultation)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  create(dto: ConsultationCreateDto): Observable<Consultation> {
    return this.api.post<ConsultationDto>('/consultations', {
      patientId: dto.patientId,
      symptoms: dto.symptoms,
      clinicalExam: dto.clinicalExam,
      diagnosis: dto.diagnosis,
      treatmentPlan: dto.treatmentPlan,
      observations: dto.observations,
    }).pipe(
      map(item => ({ ...item, patientName: '', patientNumber: '', dentistName: '' } as Consultation)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  validate(id: string): Observable<Consultation> {
    return this.api.post<ConsultationDto>(`/consultations/${id}/validate`, {}).pipe(
      map(item => ({ ...item, patientName: '', patientNumber: '', dentistName: '' } as Consultation)),
      catchError(error => throwError(() => apiError(error))),
    );
  }
}
