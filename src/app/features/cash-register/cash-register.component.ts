import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideCircleDollarSign as Cash, LucideLockKeyhole as Lock, LucideUnlockKeyhole as Unlock } from '@lucide/angular';
import { CashRegisterService } from './services/cash-register.service';
import { FcfaPipe } from '../../shared/pipes/fcfa.pipe';
import { DateFrPipe } from '../../shared/pipes/date-fr.pipe';
import { LucideIconComponent } from '../../shared/components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-cash-register',
  standalone: true,
  imports: [FormsModule, FcfaPipe, DateFrPipe, LucideIconComponent],
  templateUrl: './cash-register.component.html',
  styleUrls: ['./cash-register.component.css'],
})
export class CashRegisterComponent {
  private readonly cashRegisterService = inject(CashRegisterService);

  readonly icons = { Cash, Lock, Unlock };
  readonly sessions = this.cashRegisterService.sessions;
  readonly currentSession = computed(
    () => this.sessions().find(session => session.status === 'OUVERTE') ?? null,
  );
  readonly openingAmount = signal(0);
  readonly closingAmount = signal(0);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');

  updateOpeningAmount(value: number): void {
    this.openingAmount.set(Number.isFinite(value) && value >= 0 ? value : 0);
  }

  updateClosingAmount(value: number): void {
    this.closingAmount.set(Number.isFinite(value) && value >= 0 ? value : 0);
  }

  openSession(): void {
    this.clearMessages();
    if (this.openingAmount() < 0) {
      this.error.set('Le montant d’ouverture doit être positif ou nul.');
      return;
    }

    this.saving.set(true);
    this.cashRegisterService.openSession(this.openingAmount()).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('La session de caisse est ouverte.');
      },
      error: error => {
        this.saving.set(false);
        this.error.set(error instanceof Error ? error.message : 'Impossible d’ouvrir la caisse.');
      },
    });
  }

  closeSession(): void {
    this.clearMessages();
    if (this.closingAmount() < 0) {
      this.error.set('Le montant de clôture doit être positif ou nul.');
      return;
    }

    this.saving.set(true);
    this.cashRegisterService.closeSession(this.closingAmount()).subscribe({
      next: session => {
        this.saving.set(false);
        this.success.set(
          `Session clôturée. Écart constaté : ${(session.differenceFcfa ?? 0).toLocaleString('fr-FR')} FCFA.`,
        );
      },
      error: error => {
        this.saving.set(false);
        this.error.set(error instanceof Error ? error.message : 'Impossible de clôturer la caisse.');
      },
    });
  }

  private clearMessages(): void {
    this.error.set('');
    this.success.set('');
  }
}
