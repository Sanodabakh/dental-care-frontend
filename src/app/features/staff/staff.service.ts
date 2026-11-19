import { Injectable } from '@angular/core';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { apiError } from '../../core/services/api-error';
import { Staff, StaffCreateDto } from '../../shared/models/staff.model';

@Injectable({ providedIn: 'root' })
export class StaffService {
  constructor(private api: ApiService) {}

  list(params?: { search?: string }): Observable<Staff[]> {
    return this.api.getPage<Staff>('/staff', {
      search: params?.search?.trim() || undefined,
      size: 1000,
    }).pipe(
      map(page => page.items),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getById(id: string): Observable<Staff> {
    return this.api.get<Staff>(`/staff/${id}`)
      .pipe(catchError(error => throwError(() => apiError(error))));
  }

  create(dto: StaffCreateDto): Observable<Staff> {
    return this.api.post<Staff>('/staff', {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      specialty: dto.specialty,
      active: true,
    }).pipe(catchError(error => throwError(() => apiError(error))));
  }

  toggleActive(id: string): Observable<Staff> {
    return this.getById(id).pipe(
      switchMap(existing => this.api.patch<Staff>(
        `/staff/${id}/active?value=${!existing.active}`, {},
      )),
      catchError(error => throwError(() => apiError(error))),
    );
  }
}
