import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, map, switchMap, tap, throwError } from 'rxjs';
import { Payment, PaymentCreateDto } from '../../../shared/models/payment.model';
import { InvoiceService } from '../../billing/invoice.service';

const STORAGE_KEY = 'dc_payments';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly _payments = signal<Payment[]>(this.loadFromStorage());
  readonly payments = this._payments.asReadonly();

  constructor(private invoiceService: InvoiceService) {}

  list(params?: { search?: string }): Observable<Payment[]> {
    let items = [...this._payments()];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(p =>
        p.receiptNumber.toLowerCase().includes(q) ||
        p.patientName?.toLowerCase().includes(q) ||
        p.invoiceNumber?.toLowerCase().includes(q),
      );
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return of(items).pipe(delay(200));
  }

  create(dto: PaymentCreateDto): Observable<Payment> {
    return this.invoiceService.getById(dto.invoiceId).pipe(
      switchMap(inv => {
        if (!inv) return throwError(() => new Error('Facture introuvable.'));
        if (inv.status === 'BROUILLON') {
          return throwError(() => new Error('La facture doit être validée avant paiement.'));
        }
        if (inv.status === 'ANNULEE') {
          return throwError(() => new Error('Cette facture est annulée.'));
        }
        if (!Number.isFinite(dto.amountFcfa) || dto.amountFcfa <= 0) {
          return throwError(() => new Error('Le montant du paiement doit être supérieur à zéro.'));
        }
        if (dto.amountFcfa > inv.balanceFcfa) {
          return throwError(() => new Error(
            `Le montant dépasse le solde restant (${inv.balanceFcfa.toLocaleString('fr-FR')} FCFA).`,
          ));
        }

        const year = new Date().getFullYear();
        const count = this._payments().filter(p => p.receiptNumber.startsWith(`REC-${year}-`)).length;
        const receiptNumber = `REC-${year}-${String(count + 1).padStart(4, '0')}`;

        const payment: Payment = {
          id: this.generateUuid(),
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          patientId: inv.patientId,
          patientNumber: inv.patientNumber ?? '',
          patientName: inv.patientName ?? '',
          amountFcfa: dto.amountFcfa,
          paymentMethod: dto.paymentMethod,
          paymentDate: new Date().toISOString(),
          reference: dto.reference,
          receiptNumber,
          createdBy: 'Dr. Omar Fall',
          createdAt: new Date().toISOString(),
        };

        return this.invoiceService.registerPayment(inv.id, dto.amountFcfa).pipe(
          map(() => payment),
          tap(payment => {
            this._payments.update(list => [payment, ...list]);
            this.saveToStorage();
          }),
        );
      }),
      delay(300),
    );
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private loadFromStorage(): Payment[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._payments()));
  }
}