export interface Expense {
  id: string;
  category: string;
  label: string;
  amountFcfa: number;
  expenseDate: string;
  paymentMethod: string;
  reference?: string;
  createdAt: string;
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