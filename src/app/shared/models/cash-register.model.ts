export type CashSessionStatus = 'OUVERTE' | 'FERMEE';

export interface CashSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  openingAmountFcfa: number;
  closingAmountFcfa?: number;
  expectedAmountFcfa?: number;
  differenceFcfa?: number;
  status: CashSessionStatus;
}

export interface CashMovement {
  id: string;
  sessionId: string;
  type: 'ENTREE' | 'SORTIE';
  amountFcfa: number;
  label: string;
  reference?: string;
  createdAt: string;
  createdBy: string;
}