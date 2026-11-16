import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { CashMovement, CashSession } from '../../../shared/models/cash-register.model';

const STORAGE_KEY = 'dc_cash_sessions';

@Injectable({ providedIn: 'root' })
export class CashRegisterService {
  private readonly _sessions = signal<CashSession[]>(this.loadFromStorage());
  readonly sessions = this._sessions.asReadonly();

  getCurrentSession(): CashSession | null {
    return this._sessions().find(s => s.status === 'OUVERTE') ?? null;
  }

  openSession(openingAmount: number): Observable<CashSession> {
    if (this.getCurrentSession()) {
      return throwError(() => new Error('Une session est déjà ouverte'));
    }
    if (!Number.isFinite(openingAmount) || openingAmount < 0) {
      return throwError(() => new Error('Le montant d’ouverture doit être positif ou nul.'));
    }

    const session: CashSession = {
      id: this.generateUuid(),
      openedAt: new Date().toISOString(),
      openedBy: 'Dr. Omar Fall',
      openingAmountFcfa: openingAmount,
      status: 'OUVERTE',
    };
    this._sessions.update(list => [session, ...list]);
    this.saveToStorage();
    return of(session).pipe(delay(300));
  }

  closeSession(closingAmount: number): Observable<CashSession> {
    const current = this.getCurrentSession();
    if (!current) return throwError(() => new Error('Aucune session ouverte'));
    if (!Number.isFinite(closingAmount) || closingAmount < 0) {
      return throwError(() => new Error('Le montant de clôture doit être positif ou nul.'));
    }

    // Calcul du montant attendu = ouverture + mouvements
    const expected = current.openingAmountFcfa + this.calculateMovements(current.id);

    const updated: CashSession = {
      ...current,
      closedAt: new Date().toISOString(),
      closedBy: 'Dr. Omar Fall',
      closingAmountFcfa: closingAmount,
      expectedAmountFcfa: expected,
      differenceFcfa: closingAmount - expected,
      status: 'FERMEE',
    };

    this._sessions.update(list => list.map(s => s.id === current.id ? updated : s));
    this.saveToStorage();
    return of(updated).pipe(delay(300));
  }

  getMovements(sessionId: string): Observable<CashMovement[]> {
    const key = `dc_cash_movements_${sessionId}`;
    const raw = localStorage.getItem(key);
    const items: CashMovement[] = raw ? JSON.parse(raw) : [];
    return of(items).pipe(delay(150));
  }

  private calculateMovements(sessionId: string): number {
    const key = `dc_cash_movements_${sessionId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const items: CashMovement[] = JSON.parse(raw);
    return items.reduce((sum, m) => m.type === 'ENTREE' ? sum + m.amountFcfa : sum - m.amountFcfa, 0);
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private loadFromStorage(): CashSession[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._sessions()));
  }
}