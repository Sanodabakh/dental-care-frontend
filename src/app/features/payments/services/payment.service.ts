import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { apiError } from '../../../core/services/api-error';
import { PatientService } from '../../patients/patient.service';
import { Payment, PaymentCreateDto } from '../../../shared/models/payment.model';

interface PaymentDto {
  id: string;
  invoiceId: string;
  patientId: string;
  amountFcfa: number;
  paymentMethod: Payment['paymentMethod'];
  paymentDate: string;
  reference?: string;
  receiptNumber: string;
  createdBy: string;
}

interface InvoiceRef {
  id: string;
  invoiceNumber: string;
  patientId: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private api: ApiService, private patientService: PatientService) {}

  list(params?: { search?: string; patientId?: string }): Observable<Payment[]> {
    return forkJoin({
      page: this.api.getPage<PaymentDto>('/payments', {
        size: 1000,
        patientId: params?.patientId,
      }),
      patients: this.patientService.listAll().pipe(catchError(() => of([]))),
      invoices: this.api.getPage<InvoiceRef>('/invoices', { size: 1000 })
        .pipe(map(page => page.items), catchError(() => of([]))),
    }).pipe(
      map(({ page, patients, invoices }) => {
        const patientsById = new Map(patients.map(patient => [patient.id, patient] as const));
        const invoicesById = new Map(invoices.map(invoice => [invoice.id, invoice] as const));
        const query = params?.search?.trim().toLocaleLowerCase('fr-FR');
        return page.items
          .map(item => this.toModel(item, patientsById.get(item.patientId), invoicesById.get(item.invoiceId)))
          .filter(payment => !query ||
            payment.receiptNumber.toLocaleLowerCase('fr-FR').includes(query) ||
            (payment.patientName ?? '').toLocaleLowerCase('fr-FR').includes(query) ||
            (payment.invoiceNumber ?? '').toLocaleLowerCase('fr-FR').includes(query));
      }),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  create(dto: PaymentCreateDto): Observable<Payment> {
    return this.api.post<PaymentDto>('/payments', {
      invoiceId: dto.invoiceId,
      amountFcfa: dto.amountFcfa,
      paymentMethod: dto.paymentMethod,
      reference: dto.reference,
    }).pipe(
      switchMap(payment => forkJoin({
        patients: this.patientService.listAll().pipe(catchError(() => of([]))),
        invoices: this.api.getPage<InvoiceRef>('/invoices', { size: 1000 })
          .pipe(map(page => page.items), catchError(() => of([]))),
        payment: of(payment),
      })),
      map(({ payment, patients, invoices }) => this.toModel(
        payment,
        patients.find(patient => patient.id === payment.patientId),
        invoices.find(invoice => invoice.id === payment.invoiceId),
      )),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  /** Reçu de paiement PDF généré par le backend (logo du cabinet). */
  downloadReceipt(id: string): Observable<HttpResponse<Blob>> {
    return this.api.getBlob(`/payments/${id}/receipt`)
      .pipe(catchError(error => throwError(() => apiError(error))));
  }

  private toModel(
    item: PaymentDto,
    patient?: { patientNumber?: string; firstName?: string; lastName?: string },
    invoice?: InvoiceRef,
  ): Payment {
    return {
      id: item.id,
      invoiceId: item.invoiceId,
      invoiceNumber: invoice?.invoiceNumber,
      patientId: item.patientId,
      patientNumber: patient?.patientNumber,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined,
      amountFcfa: item.amountFcfa,
      paymentMethod: item.paymentMethod,
      paymentDate: item.paymentDate,
      reference: item.reference,
      receiptNumber: item.receiptNumber,
      createdBy: item.createdBy,
      createdAt: item.paymentDate,
    };
  }
}
