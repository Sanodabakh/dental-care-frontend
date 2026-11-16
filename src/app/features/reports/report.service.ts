import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, throwError } from 'rxjs';
import { ExpenseService } from '../finance/expense.service';
import { InvoiceService } from '../billing/invoice.service';
import { AppointmentService } from '../appointments/appointment.service';
import { ConsultationService } from '../consultations/consultation.service';
import { PaymentService } from '../payments/services/payment.service';
import { PatientService } from '../patients/patient.service';
import { TreatmentService } from '../treatments/treatment.service';
import { PeriodReport, TopTreatment } from '../../shared/models/report.model';
import { Invoice } from '../../shared/models/invoice.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly invoiceService = inject(InvoiceService);
  private readonly expenseService = inject(ExpenseService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly consultationService = inject(ConsultationService);
  private readonly paymentService = inject(PaymentService);
  private readonly patientService = inject(PatientService);
  private readonly treatmentService = inject(TreatmentService);

  generatePeriodReport(from: string, to: string): Observable<PeriodReport> {
    if (!this.isDate(from) || !this.isDate(to) || from > to) {
      return throwError(() => new Error('Sélectionnez une période valide.'));
    }

    return forkJoin({
      appointments: this.appointmentService.list(),
      consultations: this.consultationService.list(),
      invoices: this.invoiceService.list(),
      payments: this.paymentService.list(),
      expenses: this.expenseService.list({ from, to }),
    }).pipe(map(({ appointments, consultations, invoices, payments, expenses }) => {
      const periodInvoices = invoices.filter(invoice =>
        this.isReportable(invoice) && this.inPeriod(invoice.invoiceDate, from, to),
      );
      const periodConsultations = consultations.filter(consultation =>
        this.inPeriod(consultation.consultationDate, from, to),
      );
      const periodAppointments = appointments.filter(appointment =>
        this.inPeriod(appointment.startTime, from, to),
      );
      const periodPayments = payments.filter(payment =>
        this.inPeriod(payment.paymentDate, from, to),
      );

      const newPatients = this.patientService.patients().filter(patient =>
        this.inPeriod(patient.createdAt, from, to),
      ).length;

      return {
        from,
        to,
        totalAppointments: periodAppointments.length,
        totalConsultations: periodConsultations.length,
        totalInvoices: periodInvoices.length,
        totalRevenueFcfa: periodPayments.reduce((sum, payment) => sum + payment.amountFcfa, 0),
        totalExpensesFcfa: expenses.reduce((sum, expense) => sum + expense.amountFcfa, 0),
        totalUnpaidFcfa: periodInvoices.reduce((sum, invoice) => sum + invoice.balanceFcfa, 0),
        newPatients,
      };
    }));
  }

  getTopTreatments(from?: string, to?: string): Observable<TopTreatment[]> {
    return forkJoin({
      invoices: this.invoiceService.list(),
      treatments: this.treatmentService.list(),
    }).pipe(map(({ invoices, treatments }) => {
      const treatmentsById = new Map(treatments.map(treatment => [treatment.id, treatment] as const));
      const totals = new Map<string, TopTreatment>();

      for (const invoice of invoices) {
        if (!this.isReportable(invoice) ||
          (from && !this.inPeriod(invoice.invoiceDate, from, to ?? from))) {
          continue;
        }

        for (const line of invoice.lines) {
          const treatment = line.treatmentId
            ? treatmentsById.get(line.treatmentId)
            : undefined;
          const key = treatment?.id ?? line.treatmentId ?? line.description.trim().toLocaleLowerCase('fr-FR');
          const current = totals.get(key) ?? {
            code: treatment?.code ?? '—',
            name: treatment?.name ?? line.description,
            count: 0,
            revenueFcfa: 0,
          };
          current.count += line.quantity;
          current.revenueFcfa += line.lineTotalFcfa;
          totals.set(key, current);
        }
      }

      return [...totals.values()]
        .sort((a, b) => b.count - a.count || b.revenueFcfa - a.revenueFcfa)
        .slice(0, 10);
    }));
  }

  private isReportable(invoice: Invoice): boolean {
    return invoice.status !== 'BROUILLON' && invoice.status !== 'ANNULEE';
  }

  private inPeriod(value: string, from: string, to: string): boolean {
    const date = value.slice(0, 10);
    return date >= from && date <= to;
  }

  private isDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
  }
}
