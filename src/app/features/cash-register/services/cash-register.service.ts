import { Injectable, signal } from '@angular/core';
import { Observable, catchError, map, switchMap, tap, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { apiError } from '../../../core/services/api-error';
import { CashMovement, CashSession } from '../../../shared/models/cash-register.model';

@Injectable({ providedIn: 'root' })
export class CashRegisterService {
  private readonly _sessions = signal<CashSession[]>([]);
  readonly sessions = this._sessions.asReadonly();

  constructor(private api: ApiService) {}

  refresh(): Observable<CashSession[]> {
    return this.api.getPage<CashSession>('/cash-sessions', { size: 100 }).pipe(
      map(page => page.items),
      tap(sessions => this._sessions.set(sessions)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getCurrentSession(): CashSession | null {
    return this._sessions().find(session => session.status === 'OUVERTE') ?? null;
  }

  openSession(openingAmount: number): Observable<CashSession> {
    return this.api.post<CashSession>('/cash-sessions/open', { openingAmountFcfa: openingAmount }).pipe(
      switchMap(session => this.refresh().pipe(map(() => session))),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  closeSession(closingAmount: number): Observable<CashSession> {
    const current = this.getCurrentSession();
    if (!current) {
      return throwError(() => new Error('Aucune session ouverte'));
    }
    return this.api.post<CashSession>(`/cash-sessions/${current.id}/close`, { closingAmountFcfa: closingAmount }).pipe(
      switchMap(session => this.refresh().pipe(map(() => session))),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getMovements(sessionId: string): Observable<CashMovement[]> {
    return this.api.get<CashMovement[]>(`/cash-sessions/${sessionId}/movements`)
      .pipe(catchError(error => throwError(() => apiError(error))));
  }
}
