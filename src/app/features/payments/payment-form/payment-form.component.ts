import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft as ArrowLeft, LucideSave as Save } from '@lucide/angular';
import { InvoiceService } from '../../billing/invoice.service';
import { PaymentService } from '../services/payment.service';
import { Invoice } from '../../../shared/models/invoice.model';
import { PaymentMethod } from '../../../shared/models/payment.model';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [FormsModule, RouterLink, FcfaPipe, LucideIconComponent],
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.css'],
})
export class PaymentFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invoiceService = inject(InvoiceService);
  private readonly paymentService = inject(PaymentService);

  readonly icons = { ArrowLeft, Save };
  readonly invoiceNumber = signal('');
  readonly invoice = signal<Invoice | null>(null);
  readonly amountFcfa = signal(0);
  readonly paymentMethod = signal<PaymentMethod>('ESPECES');
  readonly reference = signal('');
  readonly loadingInvoice = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly methods: Array<{ value: PaymentMethod; label: string }> = [
    { value: 'ESPECES', label: 'Espèces' },
    { value: 'WAVE', label: 'Wave' },
    { value: 'ORANGE_MONEY', label: 'Orange Money' },
    { value: 'VIREMENT', label: 'Virement bancaire' },
    { value: 'CARTE', label: 'Carte bancaire' },
    { value: 'AUTRE', label: 'Autre' },
  ];

  canPay(): boolean {
    const status = this.invoice()?.status;
    return status === 'VALIDEE' || status === 'PARTIELLEMENT_PAYEE';
  }

  invoiceStatusLabel(): string {
    return this.invoice()?.status === 'PARTIELLEMENT_PAYEE' ? 'Partiellement payée' : 'Validée';
  }

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.queryParamMap.get('invoiceId');
    if (invoiceId) this.loadInvoiceById(invoiceId);
  }

  searchInvoice(): void {
    const number = this.invoiceNumber().trim();
    if (!number) {
      this.error.set('Saisissez le numéro de la facture.');
      this.invoice.set(null);
      return;
    }

    this.loadingInvoice.set(true);
    this.error.set('');
    this.invoiceService.findByNumber(number).subscribe({
      next: invoice => {
        this.loadingInvoice.set(false);
        this.setInvoice(invoice);
      },
      error: error => {
        this.loadingInvoice.set(false);
        this.error.set(error instanceof Error ? error.message : 'Impossible de rechercher la facture.');
      },
    });
  }

  updateAmount(value: number): void {
    this.amountFcfa.set(Number.isFinite(value) && value >= 0 ? value : 0);
  }

  submit(): void {
    const invoice = this.invoice();
    if (!invoice) {
      this.error.set('Recherchez une facture avant d’enregistrer le paiement.');
      return;
    }
    if (invoice.status !== 'VALIDEE' && invoice.status !== 'PARTIELLEMENT_PAYEE') {
      this.error.set('Cette facture ne peut pas recevoir de paiement.');
      return;
    }
    if (this.amountFcfa() <= 0 || this.amountFcfa() > invoice.balanceFcfa) {
      this.error.set('Saisissez un montant positif ne dépassant pas le solde restant.');
      return;
    }

    this.error.set('');
    this.saving.set(true);
    this.paymentService.create({
      invoiceId: invoice.id,
      amountFcfa: this.amountFcfa(),
      paymentMethod: this.paymentMethod(),
      reference: this.reference().trim() || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/payments']);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible d’enregistrer le paiement.');
        this.saving.set(false);
      },
    });
  }

  private loadInvoiceById(id: string): void {
    this.loadingInvoice.set(true);
    this.invoiceService.getById(id).subscribe({
      next: invoice => {
        this.loadingInvoice.set(false);
        this.setInvoice(invoice);
      },
      error: error => {
        this.loadingInvoice.set(false);
        this.error.set(error instanceof Error ? error.message : 'Impossible de charger la facture.');
      },
    });
  }

  private setInvoice(invoice: Invoice | undefined): void {
    if (!invoice) {
      this.invoice.set(null);
      this.error.set('Facture introuvable.');
      return;
    }
    this.invoice.set(invoice);
    this.invoiceNumber.set(invoice.invoiceNumber);
    if (invoice.status !== 'VALIDEE' && invoice.status !== 'PARTIELLEMENT_PAYEE') {
      this.error.set('Cette facture ne peut pas recevoir de paiement.');
    } else {
      this.error.set('');
    }
  }
}
