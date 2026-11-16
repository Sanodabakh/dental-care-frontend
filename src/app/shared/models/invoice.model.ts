export type InvoiceStatus =
  | 'BROUILLON' | 'VALIDEE' | 'PARTIELLEMENT_PAYEE' | 'PAYEE' | 'ANNULEE';

export interface InvoiceLine {
  id: string;
  invoiceId?: string;
  treatmentId?: string;
  description: string;
  quantity: number;
  unitPriceFcfa: number;
  lineTotalFcfa: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientNumber?: string;
  patientName?: string;
  consultationId?: string;
  invoiceDate: string;
  subtotalFcfa: number;
  discountFcfa: number;
  totalFcfa: number;
  paidFcfa: number;
  balanceFcfa: number;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  createdAt: string;
  validatedAt?: string;
}