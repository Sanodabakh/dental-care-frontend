import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import {
  Invoice, InvoiceLine, InvoiceStatus,
} from '../../../shared/models/invoice.model';

const STORAGE_KEY = 'dc_invoices';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly _invoices = signal<Invoice[]>(this.loadFromStorage());
  readonly invoices = this._invoices.asReadonly();

  list(params?: { search?: string; status?: InvoiceStatus | 'ALL' }): Observable<Invoice[]> {
    let items = [...this._invoices()];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(i =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.patientName?.toLowerCase().includes(q),
      );
    }
    if (params?.status && params.status !== 'ALL') {
      items = items.filter(i => i.status === params.status);
    }
    items.sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
    return of(items).pipe(delay(200));
  }

  getById(id: string): Observable<Invoice | undefined> {
    return of(this._invoices().find(i => i.id === id)).pipe(delay(150));
  }

  findByNumber(invoiceNumber: string): Observable<Invoice | undefined> {
    return of(this._invoices().find(i => i.invoiceNumber === invoiceNumber)).pipe(delay(150));
  }

  create(payload: {
    patientId: string;
    patientName: string;
    lines: Omit<InvoiceLine, 'id' | 'invoiceId'>[];
    discountFcfa: number;
  }): Observable<Invoice> {
    const year = new Date().getFullYear();
    const count = this._invoices().filter(i => i.invoiceNumber.startsWith(`FAC-${year}-`)).length;
    const invoiceNumber = `FAC-${year}-${String(count + 1).padStart(4, '0')}`;

    const subtotal = payload.lines.reduce((s, l) => s + l['lineTotalFcfa'], 0);
    const total = subtotal - payload.discountFcfa;

    const invoice: Invoice = {
      id: this.generateUuid(),
      invoiceNumber,
      patientId: payload.patientId,
      patientName: payload.patientName,
      invoiceDate: new Date().toISOString().slice(0, 10),
      subtotalFcfa: subtotal,
      discountFcfa: payload.discountFcfa,
      totalFcfa: total,
      paidFcfa: 0,
      balanceFcfa: total,
      status: 'BROUILLON',
      lines: payload.lines.map(l => ({ ...l, id: this.generateUuid(), invoiceId: '' })),
      createdAt: new Date().toISOString(),
    };

    this._invoices.update(list => [invoice, ...list]);
    this.saveToStorage();
    return of(invoice).pipe(delay(300));
  }

  validate(id: string): Observable<Invoice> {
    const existing = this._invoices().find(i => i.id === id);
    if (!existing) return throwError(() => new Error('Facture introuvable'));

    const updated: Invoice = {
      ...existing,
      status: 'VALIDEE' as InvoiceStatus,
      validatedAt: new Date().toISOString(),
    };
    this._invoices.update(list => list.map(i => i.id === id ? updated : i));
    this.saveToStorage();
    return of(updated).pipe(delay(200));
  }

  registerPayment(id: string, amount: number): Observable<Invoice> {
    const existing = this._invoices().find(i => i.id === id);
    if (!existing) return throwError(() => new Error('Facture introuvable'));

    const newPaid = existing.paidFcfa + amount;
    const newBalance = existing.totalFcfa - newPaid;

    let status: InvoiceStatus = existing.status;
    if (newBalance <= 0) status = 'PAYEE';
    else if (newPaid > 0) status = 'PARTIELLEMENT_PAYEE';

    const updated: Invoice = {
      ...existing,
      paidFcfa: newPaid,
      balanceFcfa: newBalance,
      status,
    };
    this._invoices.update(list => list.map(i => i.id === id ? updated : i));
    this.saveToStorage();
    return of(updated).pipe(delay(200));
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private loadFromStorage(): Invoice[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._invoices()));
  }
}