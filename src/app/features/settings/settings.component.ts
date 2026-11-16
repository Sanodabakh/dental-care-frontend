import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideBuilding2,
  LucideCheck,
  LucideSave,
  LucideShield,
  LucideUser,
} from '@lucide/angular';
import { AuthService } from '../../core/auth/auth.service';
import { AccountPreferences, ClinicSettings, SettingsService } from './settings.service';

type TabId = 'clinic' | 'user' | 'security';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, LucideUser, LucideBuilding2, LucideShield, LucideSave, LucideCheck],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);
  private readonly settings = inject(SettingsService);

  readonly activeTab = signal<TabId>('clinic');
  readonly saved = signal(false);
  readonly error = signal('');

  private readonly initialClinic = this.settings.readClinic();
  private readonly initialAccount = this.settings.readAccount({
    fullName: this.auth.user()?.fullName ?? '',
    email: this.auth.user()?.email ?? '',
    phone: '',
  });

  readonly clinicName = signal(this.initialClinic.name);
  readonly clinicAddress = signal(this.initialClinic.address);
  readonly clinicPhone = signal(this.initialClinic.phone);
  readonly clinicEmail = signal(this.initialClinic.email);
  readonly fullName = signal(this.initialAccount.fullName);
  readonly email = signal(this.initialAccount.email);
  readonly phone = signal(this.initialAccount.phone);
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');

  setTab(tab: TabId): void {
    this.activeTab.set(tab);
    this.saved.set(false);
    this.error.set('');
  }

  save(): void {
    this.saved.set(false);
    this.error.set('');
    try {
      if (this.activeTab() === 'clinic') {
        const clinic: ClinicSettings = {
          name: this.clinicName(),
          address: this.clinicAddress(),
          phone: this.clinicPhone(),
          email: this.clinicEmail(),
        };
        this.settings.saveClinic(clinic);
      } else if (this.activeTab() === 'user') {
        const account: AccountPreferences = {
          fullName: this.fullName(),
          email: this.email(),
          phone: this.phone(),
        };
        this.settings.saveAccount(account);
      } else {
        this.error.set('Le changement de mot de passe nécessite un service d’authentification sécurisé, non configuré dans cette version.');
        return;
      }
      this.saved.set(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Impossible d’enregistrer les paramètres.');
    }
  }
}
