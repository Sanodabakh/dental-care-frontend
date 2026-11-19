import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { apiError } from '../../core/services/api-error';
import { PeriodReport, TopTreatment } from '../../shared/models/report.model';

interface TopTreatmentDto {
  treatmentId: string;
  code?: string;
  name: string;
  quantity: number;
  revenueFcfa: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private api: ApiService) {}

  generatePeriodReport(from: string, to: string): Observable<PeriodReport> {
    if (!this.isDate(from) || !this.isDate(to) || from > to) {
      return throwError(() => new Error('Sélectionnez une période valide.'));
    }
    return this.api.get<PeriodReport>('/reports/period', { from, to })
      .pipe(catchError(error => throwError(() => apiError(error))));
  }

  getTopTreatments(from?: string, to?: string): Observable<TopTreatment[]> {
    const start = from ?? `${new Date().getFullYear()}-01-01`;
    const end = to ?? new Date().toISOString().slice(0, 10);
    return this.api.get<TopTreatmentDto[]>('/reports/treatments', { from: start, to: end, limit: 10 }).pipe(
      map(items => items.map(item => ({
        code: item.code ?? '—',
        name: item.name,
        count: item.quantity,
        revenueFcfa: item.revenueFcfa,
      }))),
      catchError(() => of([] as TopTreatment[])),
    );
  }

  /** Rapport d'activité PDF généré par le backend. */
  downloadPdf(from: string, to: string): Observable<HttpResponse<Blob>> {
    return this.api.getBlob('/reports/period.pdf', { from, to })
      .pipe(catchError(error => throwError(() => apiError(error))));
  }

  private isDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
  }
}
