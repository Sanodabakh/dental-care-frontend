import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Invoice, InvoiceLine, InvoiceStatus } from '../../shared/models/invoice.model';

const STORAGE_KEY = 'dc_invoices';

export interface InvoiceCreateDto {
  patientId: string;
  patientNumber?: string;
  patientName?: string;
  consultationId?: string;
  discountFcfa?: number;
  lines: Array<Pick<InvoiceLine, 'description' | 'quantity' | 'unitPriceFcfa'> & {
    treatmentId?: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly _invoices = signal<Invoice[]>(this.loadFromStorage());
  readonly invoices = this._invoices.asReadonly();

  list(params?: { search?: string; status?: InvoiceStatus | 'ALL' }): Observable<Invoice[]> {
    let items = [...this._invoices()];
    const query = params?.search?.trim().toLocaleLowerCase('fr-FR');
    if (query) {
      items = items.filter(invoice =>
        invoice.invoiceNumber.toLocaleLowerCase('fr-FR').includes(query) ||
        (invoice.patientName ?? '').toLocaleLowerCase('fr-FR').includes(query),
      );
    }
    if (params?.status && params.status !== 'ALL') {
      items = items.filter(invoice => invoice.status === params.status);
    }
    items.sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
    return of(items).pipe(delay(200));
  }

  getById(id: string): Observable<Invoice | undefined> {
    return of(this._invoices().find(invoice => invoice.id === id)).pipe(delay(150));
  }

  findByNumber(invoiceNumber: string): Observable<Invoice | undefined> {
    const normalized = invoiceNumber.trim().toLocaleUpperCase('fr-FR');
    return of(this._invoices().find(
      invoice => invoice.invoiceNumber.toLocaleUpperCase('fr-FR') === normalized,
    )).pipe(delay(150));
  }

  create(dto: InvoiceCreateDto): Observable<Invoice> {
    if (dto.lines.length === 0) {
      return throwError(() => new Error('Ajoutez au moins une ligne à la facture.'));
    }
    if (dto.lines.some(line =>
      !line.description.trim() ||
      !Number.isFinite(line.quantity) ||
      !Number.isFinite(line.unitPriceFcfa) ||
      line.quantity <= 0 ||
      line.unitPriceFcfa < 0,
    )) {
      return throwError(() => new Error('Vérifiez les descriptions, quantités et prix.'));
    }

    const subtotalFcfa = dto.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPriceFcfa,
      0,
    );
    const discountFcfa = dto.discountFcfa ?? 0;
    if (!Number.isFinite(discountFcfa) || discountFcfa < 0 || discountFcfa > subtotalFcfa) {
      return throwError(() => new Error('La remise doit être comprise entre 0 et le sous-total.'));
    }

    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: this.generateUuid(),
      invoiceNumber: this.nextInvoiceNumber(),
      patientId: dto.patientId,
      patientNumber: dto.patientNumber,
      patientName: dto.patientName,
      consultationId: dto.consultationId,
      invoiceDate: now,
      subtotalFcfa,
      discountFcfa,
      totalFcfa: subtotalFcfa - discountFcfa,
      paidFcfa: 0,
      balanceFcfa: subtotalFcfa - discountFcfa,
      status: 'BROUILLON',
      lines: dto.lines.map(line => ({
        ...line,
        id: this.generateUuid(),
        lineTotalFcfa: line.quantity * line.unitPriceFcfa,
      })),
      createdAt: now,
    };

    this._invoices.update(items => [invoice, ...items]);
    this.saveToStorage();
    return of(invoice).pipe(delay(300));
  }

  validate(id: string): Observable<Invoice> {
    const existing = this._invoices().find(invoice => invoice.id === id);
    if (!existing) return throwError(() => new Error('Facture introuvable.'));
    if (existing.status !== 'BROUILLON') {
      return throwError(() => new Error('Cette facture a déjà été validée.'));
    }

    const updated: Invoice = {
      ...existing,
      status: existing.balanceFcfa <= 0 ? 'PAYEE' : 'VALIDEE',
      validatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    return of(updated).pipe(delay(200));
  }

  registerPayment(id: string, amountFcfa: number): Observable<Invoice> {
    const existing = this._invoices().find(invoice => invoice.id === id);
    if (!existing) return throwError(() => new Error('Facture introuvable.'));
    if (existing.status === 'BROUILLON') {
      return throwError(() => new Error('La facture doit être validée avant paiement.'));
    }
    if (existing.status === 'ANNULEE') {
      return throwError(() => new Error('Cette facture est annulée.'));
    }
    if (!Number.isFinite(amountFcfa) || amountFcfa <= 0) {
      return throwError(() => new Error('Le montant du paiement doit être supérieur à zéro.'));
    }
    if (amountFcfa > existing.balanceFcfa) {
      return throwError(() => new Error(
        `Le montant dépasse le solde restant (${existing.balanceFcfa.toLocaleString('fr-FR')} FCFA).`,
      ));
    }

    const paidFcfa = existing.paidFcfa + amountFcfa;
    const balanceFcfa = Math.max(0, existing.totalFcfa - paidFcfa);
    const updated: Invoice = {
      ...existing,
      paidFcfa,
      balanceFcfa,
      status: balanceFcfa === 0 ? 'PAYEE' : 'PARTIELLEMENT_PAYEE',
    };
    this.replace(updated);
    return of(updated).pipe(delay(200));
  }

  private replace(updated: Invoice): void {
    this._invoices.update(items => items.map(invoice => invoice.id === updated.id ? updated : invoice));
    this.saveToStorage();
  }

  private nextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const count = this._invoices().filter(invoice =>
      invoice.invoiceNumber.startsWith(`FAC-${year}-`),
    ).length;
    return `FAC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
      const random = (Math.random() * 16) | 0;
      const value = character === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  private loadFromStorage(): Invoice[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Invoice[] : [];
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._invoices()));
  }
}
