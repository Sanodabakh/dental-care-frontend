import { Injectable } from '@angular/core';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { apiError } from '../../core/services/api-error';
import { Treatment, TreatmentCreateDto } from '../../shared/models/treatment.model';

interface TreatmentDto {
  id: string;
  code: string;
  name: string;
  category?: string;
  description?: string;
  priceFcfa: number;
  estimatedDurationMin?: number;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class TreatmentService {
  constructor(private api: ApiService) {}

  list(params?: { search?: string; category?: string; activeOnly?: boolean }): Observable<Treatment[]> {
    return this.api.getPage<TreatmentDto>('/treatments', {
      search: params?.search?.trim() || undefined,
      active: params?.activeOnly ? true : undefined,
      size: 1000,
    }).pipe(
      map(page => page.items
        .filter(item => !params?.category || params.category === 'ALL' || item.category === params.category)
        .map(item => this.toModel(item))),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getById(id: string): Observable<Treatment> {
    return this.api.get<TreatmentDto>(`/treatments/${id}`).pipe(
      map(item => this.toModel(item)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  create(dto: TreatmentCreateDto): Observable<Treatment> {
    return this.api.post<TreatmentDto>('/treatments', { ...dto, active: true }).pipe(
      map(item => this.toModel(item)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  update(id: string, dto: Partial<TreatmentCreateDto>): Observable<Treatment> {
    return this.getById(id).pipe(
      switchMap(existing => this.api.put<TreatmentDto>(`/treatments/${id}`, {
        code: dto.code ?? existing.code,
        name: dto.name ?? existing.name,
        category: dto.category ?? existing.category,
        description: dto.description ?? existing.description,
        priceFcfa: dto.priceFcfa ?? existing.priceFcfa,
        estimatedDurationMin: dto.estimatedDurationMin ?? existing.estimatedDurationMin,
        active: existing.active,
      })),
      map(item => this.toModel(item)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  toggleActive(id: string): Observable<Treatment> {
    return this.getById(id).pipe(
      switchMap(existing => this.api.patch<TreatmentDto>(
        `/treatments/${id}/active?value=${!existing.active}`, {},
      )),
      map(item => this.toModel(item)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  private toModel(dto: TreatmentDto): Treatment {
    return {
      id: dto.id,
      code: dto.code,
      name: dto.name,
      category: dto.category ?? '',
      description: dto.description,
      priceFcfa: dto.priceFcfa,
      estimatedDurationMin: dto.estimatedDurationMin,
      active: dto.active,
      createdAt: '',
    };
  }
}
