export interface DailyReport {
  date: string;
  appointments: number;
  consultations: number;
  invoices: number;
  revenueFcfa: number;
  expensesFcfa: number;
}

export interface PeriodReport {
  from: string;
  to: string;
  totalAppointments: number;
  totalConsultations: number;
  totalInvoices: number;
  totalRevenueFcfa: number;
  totalExpensesFcfa: number;
  totalUnpaidFcfa: number;
  newPatients: number;
}

export interface TopTreatment {
  code: string;
  name: string;
  count: number;
  revenueFcfa: number;
}
