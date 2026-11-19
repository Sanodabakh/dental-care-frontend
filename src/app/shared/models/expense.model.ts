export interface Expense {
  id: string;
  category: string;
  label: string;
  amountFcfa: number;
  expenseDate: string;
  paymentMethod: string;
  reference?: string;
  createdAt?: string;
  createdBy: string;
}

export interface ExpenseCreateDto {
  category: string;
  label: string;
  amountFcfa: number;
  expenseDate: string;
  paymentMethod: string;
  reference?: string;
}

/** Libellés français des catégories de dépense (enum backend). */
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  LOYER: 'Loyer',
  SALAIRES: 'Salaires',
  FOURNITURES: 'Fournitures',
  EQUIPEMENT: 'Équipement',
  MAINTENANCE: 'Maintenance',
  TRANSPORT: 'Transport',
  MARKETING: 'Marketing',
  AUTRE: 'Autre',
};
