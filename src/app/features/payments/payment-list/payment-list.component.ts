import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideEye as Eye,
  LucidePlus as Plus,
  LucideSearch as Search,
} from '@lucide/angular';
import { PaymentService } from '../services/payment.service';
import { Payment, PaymentMethod } from '../../../shared/models/payment.model';
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

  readonly icons = { Eye, Plus, Search };
  readonly payments = signal<Payment[]>([]);
  readonly search = signal('');
  readonly loading = signal(true);
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

  methodLabel(method: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      ESPECES: 'Espèces',
      WAVE: 'Wave',
      ORANGE_MONEY: 'Orange Money',
      VIREMENT: 'Virement',
      CARTE: 'Carte bancaire',
      AUTRE: 'Autre',
    };
    return labels[method];
  }
}
