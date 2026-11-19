import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { apiError } from '../../core/services/api-error';
import {
  Expense, ExpenseCreateDto, EXPENSE_CATEGORY_LABELS,
} from '../../shared/models/expense.model';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from '../../shared/models/payment.model';

interface ExpenseDto {
  id: string;
  category: string;
  label: string;
  amountFcfa: number;
  expenseDate: string;
  paymentMethod: string;
  reference?: string;
  createdBy: string;
}

const CATEGORY_TO_ENUM: Record<string, string> = Object.fromEntries(
  Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => [label.toLocaleLowerCase('fr-FR'), key]),
);

const METHOD_TO_ENUM: Record<string, PaymentMethod> = Object.fromEntries(
  (Object.entries(PAYMENT_METHOD_LABELS) as Array<[PaymentMethod, string]>)
    .map(([key, label]) => [label.toLocaleLowerCase('fr-FR'), key]),
) as Record<string, PaymentMethod>;

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  constructor(private api: ApiService) {}

  list(params?: { category?: string; from?: string; to?: string }): Observable<Expense[]> {
    return this.api.getPage<ExpenseDto>('/expenses', {
      from: params?.from,
      to: params?.to,
      category: this.categoryToEnum(params?.category),
      size: 1000,
    }).pipe(
      map(page => page.items.map(item => this.toModel(item))),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  create(dto: ExpenseCreateDto): Observable<Expense> {
    return this.api.post<ExpenseDto>('/expenses', {
      category: this.categoryToEnum(dto.category),
      label: dto.label,
      amountFcfa: dto.amountFcfa,
      expenseDate: dto.expenseDate,
      paymentMethod: this.methodToEnum(dto.paymentMethod),
      reference: dto.reference,
    }).pipe(
      map(item => this.toModel(item)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  private categoryToEnum(category?: string): string | undefined {
    if (!category || category === 'ALL') return undefined;
    if (EXPENSE_CATEGORY_LABELS[category]) return category;
    return CATEGORY_TO_ENUM[category.toLocaleLowerCase('fr-FR')] ?? 'AUTRE';
  }

  private methodToEnum(method: string): PaymentMethod {
    if (METHOD_TO_ENUM[method]) return method as PaymentMethod;
    return METHOD_TO_ENUM[method.toLocaleLowerCase('fr-FR')]
      ?? (Object.keys(PAYMENT_METHOD_LABELS).includes(method) ? method as PaymentMethod : 'ESPECES');
  }

  private toModel(dto: ExpenseDto): Expense {
    return {
      id: dto.id,
      category: EXPENSE_CATEGORY_LABELS[dto.category] ?? dto.category,
      label: dto.label,
      amountFcfa: dto.amountFcfa,
      expenseDate: dto.expenseDate,
      paymentMethod: PAYMENT_METHOD_LABELS[dto.paymentMethod as PaymentMethod] ?? dto.paymentMethod,
      reference: dto.reference,
      createdBy: dto.createdBy,
      createdAt: '',
    };
  }
}
