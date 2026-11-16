import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideCheck as Check,
  LucideEye as Eye,
  LucideFileText as FileText,
  LucideFilter as Filter,
  LucidePlus as Plus,
  LucideSearch as Search,
} from '@lucide/angular';
import { InvoiceService } from '../invoice.service';
import { Invoice, InvoiceStatus } from '../../../shared/models/invoice.model';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [FormsModule, RouterLink, FcfaPipe, DateFrPipe, LucideIconComponent],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css'],
})
export class InvoiceListComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);

  readonly icons = { Check, Eye, FileText, Filter, Plus, Search };
  readonly loading = signal(true);
  readonly invoices = signal<Invoice[]>([]);
  readonly search = signal('');
  readonly status = signal<InvoiceStatus | 'ALL'>('ALL');
  readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.invoiceService.list({ search: this.search(), status: this.status() }).subscribe({
      next: invoices => {
        this.invoices.set(invoices);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible de charger les factures.');
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.load();
  }

  onStatus(value: string): void {
    if (value === 'ALL' || this.isInvoiceStatus(value)) {
      this.status.set(value);
      this.load();
    }
  }

  validate(invoice: Invoice): void {
    if (!confirm(`Valider la facture ${invoice.invoiceNumber} ?`)) return;
    this.error.set('');
    this.invoiceService.validate(invoice.id).subscribe({
      next: () => this.load(),
      error: error => this.error.set(
        error instanceof Error ? error.message : 'Impossible de valider la facture.',
      ),
    });
  }

  statusLabel(status: InvoiceStatus): string {
    const labels: Record<InvoiceStatus, string> = {
      BROUILLON: 'Brouillon',
      VALIDEE: 'Validée',
      PARTIELLEMENT_PAYEE: 'Partiellement payée',
      PAYEE: 'Payée',
      ANNULEE: 'Annulée',
    };
    return labels[status];
  }

  statusClass(status: InvoiceStatus): string {
    const classes: Record<InvoiceStatus, string> = {
      BROUILLON: 'dc-badge dc-badge-neutral',
      VALIDEE: 'dc-badge dc-badge-warning',
      PARTIELLEMENT_PAYEE: 'dc-badge dc-badge-warning',
      PAYEE: 'dc-badge dc-badge-success',
      ANNULEE: 'dc-badge dc-badge-danger',
    };
    return classes[status];
  }

  private isInvoiceStatus(value: string): value is InvoiceStatus {
    return ['BROUILLON', 'VALIDEE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'ANNULEE'].includes(value);
  }
}
