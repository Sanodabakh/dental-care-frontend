import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAlertCircle,
  LucideCalendarDays,
  LucideDownload,
  LucideFileSpreadsheet,
  LucideFileText,
  LucideTrendingDown,
  LucideTrendingUp,
  LucideWallet,
} from '@lucide/angular';
import { ReportService } from '../report.service';
import { PeriodReport, TopTreatment } from '../../../shared/models/report.model';
import { saveBlob } from '../../../core/services/download';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    LucideFileText, LucideDownload, LucideCalendarDays, LucideTrendingUp,
    LucideTrendingDown, LucideWallet, LucideAlertCircle, LucideFileSpreadsheet,
    FcfaPipe,
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  private readonly service = inject(ReportService);

  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly error = signal('');
  readonly report = signal<PeriodReport | null>(null);
  readonly topTreatments = signal<TopTreatment[]>([]);
  readonly from = signal(this.firstDayOfMonth());
  readonly to = signal(this.today());
  readonly result = computed(() => {
    const report = this.report();
    return report ? report.totalRevenueFcfa - report.totalExpensesFcfa : 0;
  });

  ngOnInit(): void {
    this.generate();
  }

  generate(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.generatePeriodReport(this.from(), this.to()).subscribe({
      next: report => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible de générer le rapport.');
        this.loading.set(false);
      },
    });
    this.service.getTopTreatments(this.from(), this.to()).subscribe({
      next: treatments => this.topTreatments.set(treatments),
      error: error => this.error.set(
        error instanceof Error ? error.message : 'Impossible de charger les actes les plus fréquents.',
      ),
    });
  }

  onFrom(value: string): void {
    this.from.set(value);
    this.generate();
  }

  onTo(value: string): void {
    this.to.set(value);
    this.generate();
  }

  /** Rapport PDF généré par le backend (logo, indicateurs, actes, paiements). */
  exportPdf(): void {
    if (!this.report()) {
      return;
    }
    this.downloading.set(true);
    this.error.set('');
    this.service.downloadPdf(this.from(), this.to()).subscribe({
      next: response => {
        saveBlob(response, `rapport-${this.from()}_${this.to()}.pdf`);
        this.downloading.set(false);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible de générer le rapport PDF.');
        this.downloading.set(false);
      },
    });
  }

  exportExcel(): void {
    const report = this.report();
    if (!report) return;

    const rows: Array<Array<string | number>> = [
      ['Rapport de période'],
      ['Du', report.from],
      ['Au', report.to],
      [],
      ['Indicateur', 'Valeur'],
      ['Rendez-vous', report.totalAppointments],
      ['Consultations', report.totalConsultations],
      ['Factures', report.totalInvoices],
      ['Recettes (FCFA)', report.totalRevenueFcfa],
      ['Dépenses (FCFA)', report.totalExpensesFcfa],
      ['Impayés (FCFA)', report.totalUnpaidFcfa],
      ['Nouveaux patients', report.newPatients],
      [],
      ['Actes les plus fréquents'],
      ['Code', 'Acte', 'Nombre', 'CA (FCFA)'],
      ...this.topTreatments().map(treatment => [
        treatment.code,
        treatment.name,
        treatment.count,
        treatment.revenueFcfa,
      ]),
    ];

    const csv = rows.map(row => row.map(value => this.csvCell(value)).join(';')).join('\r\n');
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-${report.from}-${report.to}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private csvCell(value: string | number): string {
    const text = String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private firstDayOfMonth(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  }
}
