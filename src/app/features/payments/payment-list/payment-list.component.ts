import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideDownload as Download,
  LucideEye as Eye,
  LucidePlus as Plus,
  LucideSearch as Search,
} from '@lucide/angular';
import { PaymentService } from '../services/payment.service';
import { Payment, PaymentMethod, PAYMENT_METHOD_LABELS } from '../../../shared/models/payment.model';
import { saveBlob } from '../../../core/services/download';
import { FcfaPipe } from '../../../shared/pipes/fcfa.pipe';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';
import { LucideIconComponent } from '../../../shared/components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [FormsModule, RouterLink, FcfaPipe, DateFrPipe, LucideIconComponent],
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css'],
})
export class PaymentListComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);

  readonly icons = { Eye, Plus, Search, Download };
  readonly payments = signal<Payment[]>([]);
  readonly search = signal('');
  readonly loading = signal(true);
  readonly downloadingId = signal<string | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.paymentService.list({ search: this.search() }).subscribe({
      next: items => {
        this.payments.set(items);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible de charger les paiements.');
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.load();
  }

  downloadReceipt(payment: Payment): void {
    this.downloadingId.set(payment.id);
    this.error.set('');
    this.paymentService.downloadReceipt(payment.id).subscribe({
      next: response => {
        saveBlob(response, `recu-${payment.receiptNumber}.pdf`);
        this.downloadingId.set(null);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible de générer le reçu PDF.');
        this.downloadingId.set(null);
      },
    });
  }

  methodLabel(method: PaymentMethod): string {
    return PAYMENT_METHOD_LABELS[method] ?? method;
  }
}
