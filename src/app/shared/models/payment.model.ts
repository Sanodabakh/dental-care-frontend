export type PaymentMethod =
  | 'ESPECES' | 'WAVE' | 'ORANGE_MONEY' | 'VIREMENT' | 'CARTE' | 'AUTRE';

export interface Payment {
  id: string;
  invoiceId?: string;
  invoiceNumber?: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  amountFcfa: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference?: string;
  receiptNumber: string;
  createdBy: string;
  createdAt: string;
}

export interface PaymentCreateDto {
  invoiceId: string;
  amountFcfa: number;
  paymentMethod: PaymentMethod;
  reference?: string;
}