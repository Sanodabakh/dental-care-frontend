export type PaymentMethod =
  | 'ESPECES' | 'MOBILE_MONEY' | 'CARTE' | 'VIREMENT' | 'CHEQUE';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ESPECES: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  CARTE: 'Carte bancaire',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
};

export interface Payment {
  id: string;
  invoiceId?: string;
  invoiceNumber?: string;
  patientId: string;
  patientNumber?: string;
  patientName?: string;
  amountFcfa: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  reference?: string;
  receiptNumber: string;
  createdBy: string;
  createdAt?: string;
}

export interface PaymentCreateDto {
  invoiceId: string;
  amountFcfa: number;
  paymentMethod: PaymentMethod;
  reference?: string;
}
