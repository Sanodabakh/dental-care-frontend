import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { apiError } from '../../core/services/api-error';
import { PatientService } from '../patients/patient.service';
import { Invoice, InvoiceLine, InvoiceStatus } from '../../shared/models/invoice.model';

interface InvoiceLineDto {
  id: string;
  treatmentId?: string;
  description: string;
  quantity: number;
  unitPriceFcfa: number;
  lineTotalFcfa: number;
}

interface InvoiceSummaryDto {
  id: string;
  invoiceNumber: string;
  patientId: string;
  consultationId?: string;
  invoiceDate: string;
  subtotalFcfa: number;
  discountFcfa: number;
  totalFcfa: number;
  paidFcfa: number;
  balanceFcfa: number;
  status: InvoiceStatus;
  validatedAt?: string;
}

interface InvoiceDto extends InvoiceSummaryDto {
  lines: InvoiceLineDto[];
  createdAt: string;
}

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
  constructor(private api: ApiService, private patientService: PatientService) {}

  list(params?: { search?: string; status?: InvoiceStatus | 'ALL'; patientId?: string }): Observable<Invoice[]> {
    return forkJoin({
      page: this.api.getPage<InvoiceSummaryDto>('/invoices', {
        status: params?.status && params.status !== 'ALL' ? params.status : undefined,
        patientId: params?.patientId,
        size: 1000,
      }),
      patients: this.patientService.listAll().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ page, patients }) => {
        const byId = new Map(patients.map(patient => [patient.id, patient] as const));
        const query = params?.search?.trim().toLocaleLowerCase('fr-FR');
        return page.items
          .map(item => {
            const patient = byId.get(item.patientId);
            return this.toSummary(item, patient?.patientNumber,
              patient ? `${patient.firstName} ${patient.lastName}` : undefined);
          })
          .filter(invoice => !query ||
            invoice.invoiceNumber.toLocaleLowerCase('fr-FR').includes(query) ||
            (invoice.patientName ?? '').toLocaleLowerCase('fr-FR').includes(query));
      }),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getById(id: string): Observable<Invoice> {
    return forkJoin({
      invoice: this.api.get<InvoiceDto>(`/invoices/${id}`),
      patients: this.patientService.listAll().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ invoice, patients }) => {
        const patient = patients.find(item => item.id === invoice.patientId);
        return this.toDetail(invoice, patient?.patientNumber,
          patient ? `${patient.firstName} ${patient.lastName}` : undefined);
      }),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  findByNumber(invoiceNumber: string): Observable<Invoice | undefined> {
    const normalized = invoiceNumber.trim().toLocaleUpperCase('fr-FR');
    return this.list().pipe(
      map(invoices => invoices.find(invoice =>
        invoice.invoiceNumber.toLocaleUpperCase('fr-FR') === normalized)),
    );
  }

  create(dto: InvoiceCreateDto): Observable<Invoice> {
    return this.api.post<InvoiceDto>('/invoices', {
      patientId: dto.patientId,
      consultationId: dto.consultationId,
      discountFcfa: dto.discountFcfa ?? 0,
      lines: dto.lines.map(line => ({
        treatmentId: line.treatmentId,
        description: line.description,
        quantity: line.quantity,
        unitPriceFcfa: line.unitPriceFcfa,
      })),
    }).pipe(
      map(invoice => this.toDetail(invoice, dto.patientNumber, dto.patientName)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  validate(id: string): Observable<Invoice> {
    return this.api.post<InvoiceDto>(`/invoices/${id}/validate`, {}).pipe(
      map(invoice => this.toDetail(invoice)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  cancel(id: string): Observable<Invoice> {
    return this.api.post<InvoiceDto>(`/invoices/${id}/cancel`, {}).pipe(
      map(invoice => this.toDetail(invoice)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  /** Facture PDF générée par le backend (logo du cabinet). */
  downloadPdf(id: string): Observable<HttpResponse<Blob>> {
    return this.api.getBlob(`/invoices/${id}/pdf`)
      .pipe(catchError(error => throwError(() => apiError(error))));
  }

  private toSummary(item: InvoiceSummaryDto, patientNumber?: string, patientName?: string): Invoice {
    return {
      id: item.id,
      invoiceNumber: item.invoiceNumber,
      patientId: item.patientId,
      patientNumber,
      patientName,
      consultationId: item.consultationId,
      invoiceDate: item.invoiceDate,
      subtotalFcfa: item.subtotalFcfa,
      discountFcfa: item.discountFcfa,
      totalFcfa: item.totalFcfa,
      paidFcfa: item.paidFcfa,
      balanceFcfa: item.balanceFcfa,
      status: item.status,
      lines: [],
      createdAt: item.invoiceDate,
      validatedAt: item.validatedAt,
    };
  }

  private toDetail(item: InvoiceDto, patientNumber?: string, patientName?: string): Invoice {
    return {
      ...this.toSummary(item, patientNumber, patientName),
      lines: (item.lines ?? []).map(line => ({
        id: line.id,
        treatmentId: line.treatmentId,
        description: line.description,
        quantity: line.quantity,
        unitPriceFcfa: line.unitPriceFcfa,
        lineTotalFcfa: line.lineTotalFcfa,
      })),
      createdAt: item.createdAt,
    };
  }
}
