import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideArrowLeft as ArrowLeft, LucidePrinter as Printer } from '@lucide/angular';
import { InvoiceService } from '../invoice.service';
import { Invoice, InvoiceStatus } from '../../../shared/models/invoice.model';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [RouterLink, FcfaPipe, DateFrPipe, LucideIconComponent],
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.css'],
})
export class InvoiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly invoiceService = inject(InvoiceService);

  readonly icons = { ArrowLeft, Printer };
  readonly invoice = signal<Invoice | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Identifiant de facture manquant.');
      this.loading.set(false);
      return;
    }

    this.invoiceService.getById(id).subscribe({
      next: invoice => {
        this.invoice.set(invoice ?? null);
        if (!invoice) this.error.set('Facture introuvable.');
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible de charger la facture.');
        this.loading.set(false);
      },
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

  print(): void {
    window.print();
  }
}
