import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  LucideAlertCircle,
  LucidePlus,
  LucideTrendingDown,
  LucideTrendingUp,
  LucideWallet,
} from '@lucide/angular';
import { Invoice } from '../../../shared/models/invoice.model';
import { Expense } from '../../../shared/models/expense.model';
import { InvoiceService } from '../../billing/invoice.service';
import { ExpenseService } from '../expense.service';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [
    RouterLink, BaseChartDirective, FcfaPipe,
    LucideTrendingUp, LucideTrendingDown, LucideWallet, LucideAlertCircle, LucidePlus,
  ],
  templateUrl: './finance-dashboard.component.html',
  styleUrls: ['./finance-dashboard.component.css'],
})
export class FinanceDashboardComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly expenseService = inject(ExpenseService);

  readonly totalInvoiced = signal(0);
  readonly totalPaid = signal(0);
  readonly totalUnpaid = signal(0);
  readonly totalExpenses = signal(0);
  readonly result = computed(() => this.totalPaid() - this.totalExpenses());

  revenueChartData: ChartData<'line'> = { labels: [], datasets: [] };
  expenseChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  expensePieData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  readonly lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => `${Number(value) / 1000}k`,
          color: '#9AA6B4',
          font: { size: 10 },
        },
        grid: { color: '#EDF0F4' },
        border: { display: false },
      },
      x: {
        ticks: { color: '#9AA6B4', font: { size: 10 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => `${Number(value) / 1000}k`,
          color: '#9AA6B4',
          font: { size: 10 },
        },
        grid: { color: '#EDF0F4' },
        border: { display: false },
      },
      x: {
        ticks: { color: '#9AA6B4', font: { size: 10 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#718096',
          font: { size: 11 },
          boxWidth: 10,
          boxHeight: 10,
          padding: 10,
          usePointStyle: true,
        },
      },
    },
  };

  ngOnInit(): void {
    this.invoiceService.list().subscribe({
      next: invoices => this.updateInvoiceStats(invoices),
    });
    this.expenseService.list().subscribe({
      next: expenses => this.updateExpenseStats(expenses),
    });
  }

  private updateInvoiceStats(invoices: Invoice[]): void {
    const reportable = invoices.filter(invoice =>
      invoice.status !== 'BROUILLON' && invoice.status !== 'ANNULEE',
    );
    this.totalInvoiced.set(reportable.reduce((sum, invoice) => sum + invoice.totalFcfa, 0));
    this.totalPaid.set(reportable.reduce((sum, invoice) => sum + invoice.paidFcfa, 0));
    this.totalUnpaid.set(reportable.reduce((sum, invoice) => sum + invoice.balanceFcfa, 0));

    const periods = this.monthPeriods();
    const byMonth = new Map<string, number>(periods.map(period => [period.key, 0] as const));
    for (const invoice of reportable) {
      const month = invoice.invoiceDate.slice(0, 7);
      if (byMonth.has(month)) byMonth.set(month, (byMonth.get(month) ?? 0) + invoice.paidFcfa);
    }

    this.revenueChartData = {
      labels: periods.map(period => period.label),
      datasets: [{
        data: periods.map(period => byMonth.get(period.key) ?? 0),
        borderColor: '#1769AA',
        backgroundColor: 'rgba(23, 105, 170, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#1769AA',
      }],
    };
  }

  private updateExpenseStats(expenses: Expense[]): void {
    this.totalExpenses.set(expenses.reduce((sum, expense) => sum + expense.amountFcfa, 0));
    const periods = this.monthPeriods();
    const byMonth = new Map<string, number>(periods.map(period => [period.key, 0] as const));
    const byCategory = new Map<string, number>();

    for (const expense of expenses) {
      const month = expense.expenseDate.slice(0, 7);
      if (byMonth.has(month)) {
        byMonth.set(month, (byMonth.get(month) ?? 0) + expense.amountFcfa);
      }
      byCategory.set(
        expense.category,
        (byCategory.get(expense.category) ?? 0) + expense.amountFcfa,
      );
    }

    this.expenseChartData = {
      labels: periods.map(period => period.label),
      datasets: [{
        data: periods.map(period => byMonth.get(period.key) ?? 0),
        backgroundColor: '#DC2626',
        borderRadius: 6,
        barThickness: 26,
      }],
    };

    const categories = [...byCategory.entries()];
    this.expensePieData = {
      labels: categories.map(([category]) => category),
      datasets: [{
        data: categories.map(([, amount]) => amount),
        backgroundColor: ['#1769AA', '#8B5CF6', '#F59E0B', '#17A6A1', '#6B7280'],
        borderWidth: 0,
      }],
    };
  }

  private monthPeriods(): Array<{ key: string; label: string }> {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date),
      };
    });
  }
}
