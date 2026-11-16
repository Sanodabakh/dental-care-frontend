import { Injectable } from '@angular/core';

export interface ClinicSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface AccountPreferences {
  fullName: string;
  email: string;
  phone: string;
}

const CLINIC_KEY = 'dc_clinic_settings';
const ACCOUNT_KEY = 'dc_account_preferences';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readClinic(): ClinicSettings {
    const raw = localStorage.getItem(CLINIC_KEY);
    return raw ? JSON.parse(raw) as ClinicSettings : {
      name: 'Cabinet Dentaire Les Almadies',
      address: 'Rue des Almadies, Dakar, Sénégal',
      phone: '+221 33 800 00 00',
      email: 'contact@dentalcare.sn',
    };
  }

  readAccount(defaults: AccountPreferences): AccountPreferences {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) as AccountPreferences : defaults;
  }

  saveClinic(settings: ClinicSettings): void {
    if (!settings.name.trim() || !settings.address.trim() ||
      !this.isEmail(settings.email) || !settings.phone.trim()) {
      throw new Error('Vérifiez le nom, l’adresse, le téléphone et l’email du cabinet.');
    }
    localStorage.setItem(CLINIC_KEY, JSON.stringify({
      ...settings,
      name: settings.name.trim(),
      address: settings.address.trim(),
      phone: settings.phone.trim(),
      email: settings.email.trim(),
    }));
  }

  saveAccount(preferences: AccountPreferences): void {
    if (!preferences.fullName.trim() || !this.isEmail(preferences.email) || !preferences.phone.trim()) {
      throw new Error('Vérifiez le nom, le téléphone et l’email du profil.');
    }
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({
      ...preferences,
      fullName: preferences.fullName.trim(),
      email: preferences.email.trim(),
      phone: preferences.phone.trim(),
    }));
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }
}
