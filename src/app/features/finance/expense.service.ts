import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Expense, ExpenseCreateDto } from '../../shared/models/expense.model';

const STORAGE_KEY = 'dc_expenses';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly _expenses = signal<Expense[]>(this.loadFromStorage());
  readonly expenses = this._expenses.asReadonly();

  list(params?: { category?: string; from?: string; to?: string }): Observable<Expense[]> {
    let items = [...this._expenses()];
    if (params?.category && params.category !== 'ALL') {
      items = items.filter(expense => expense.category === params.category);
    }
    if (params?.from) items = items.filter(expense => expense.expenseDate >= params.from!);
    if (params?.to) items = items.filter(expense => expense.expenseDate <= params.to!);
    items.sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
    return of(items).pipe(delay(200));
  }

  create(dto: ExpenseCreateDto): Observable<Expense> {
    if (!dto.category.trim() || !dto.label.trim() || !dto.paymentMethod.trim() ||
      !Number.isFinite(dto.amountFcfa) || dto.amountFcfa <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dto.expenseDate)) {
      return throwError(() => new Error('Vérifiez la catégorie, le libellé, la date et le montant.'));
    }

    const expense: Expense = {
      id: this.generateUuid(),
      ...dto,
      category: dto.category.trim(),
      label: dto.label.trim(),
      reference: dto.reference?.trim() || undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'Dr. Omar Fall',
    };
    this._expenses.update(list => [expense, ...list]);
    this.saveToStorage();
    return of(expense).pipe(delay(300));
  }

  totalByPeriod(from: string, to: string): number {
    return this._expenses()
      .filter(expense => expense.expenseDate >= from && expense.expenseDate <= to)
      .reduce((sum, expense) => sum + expense.amountFcfa, 0);
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
      const random = (Math.random() * 16) | 0;
      const value = character === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  private loadFromStorage(): Expense[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Expense[];
    const seed = this.getSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._expenses()));
  }

  private getSeedData(): Expense[] {
    const date = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    return [
      { id: 'e1', category: 'Loyer', label: 'Loyer cabinet Novembre', amountFcfa: 350000, expenseDate: date, paymentMethod: 'VIREMENT', createdAt: now, createdBy: 'Admin' },
      { id: 'e2', category: 'Salaires', label: 'Salaire assistante', amountFcfa: 180000, expenseDate: date, paymentMethod: 'VIREMENT', createdAt: now, createdBy: 'Admin' },
      { id: 'e3', category: 'Fournitures', label: 'Achat gants et masques', amountFcfa: 45000, expenseDate: date, paymentMethod: 'ESPECES', createdAt: now, createdBy: 'Admin' },
      { id: 'e4', category: 'Électricité', label: 'Facture SENELEC', amountFcfa: 68000, expenseDate: date, paymentMethod: 'VIREMENT', createdAt: now, createdBy: 'Admin' },
    ];
  }
}
