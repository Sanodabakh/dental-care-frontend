import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import {
  Notification,
  NotificationCreateDto,
} from '../../shared/models/notification.model';

const STORAGE_KEY = 'dc_notifications';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<Notification[]>(this.loadFromStorage());
  readonly notifications = this._notifications.asReadonly();

  list(): Observable<Notification[]> {
    const items = [...this._notifications()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    return of(items).pipe(delay(200));
  }

  send(dto: NotificationCreateDto): Observable<Notification> {
    if (!dto.patientPhone.trim()) {
      return throwError(() => new Error('Ce patient n’a pas de numéro de téléphone renseigné.'));
    }
    if (!dto.message.trim()) {
      return throwError(() => new Error('Le message ne peut pas être vide.'));
    }

    const now = new Date().toISOString();
    const notification: Notification = {
      ...dto,
      id: this.generateUuid(),
      patientPhone: dto.patientPhone.trim(),
      message: dto.message.trim(),
      status: 'ENVOYE',
      sentAt: now,
      createdAt: now,
    };
    this._notifications.update(list => [notification, ...list]);
    this.saveToStorage();
    return of(notification).pipe(delay(600));
  }

  retry(id: string): Observable<Notification> {
    const existing = this._notifications().find(notification => notification.id === id);
    if (!existing) return throwError(() => new Error('Notification introuvable.'));
    if (existing.status !== 'ECHEC') {
      return throwError(() => new Error('Seules les notifications en échec peuvent être relancées.'));
    }
    if (!existing.patientPhone.trim()) {
      return throwError(() => new Error('Le patient n’a pas de numéro de téléphone renseigné.'));
    }

    const updated: Notification = {
      ...existing,
      status: 'ENVOYE',
      sentAt: new Date().toISOString(),
      errorMessage: undefined,
    };
    this._notifications.update(list => list.map(item => item.id === id ? updated : item));
    this.saveToStorage();
    return of(updated).pipe(delay(400));
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
      const random = (Math.random() * 16) | 0;
      const value = character === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  private loadFromStorage(): Notification[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Notification[];
    const seed = this.getSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._notifications()));
  }

  private getSeedData(): Notification[] {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const currentTime = now.toISOString();

    return [
      {
        id: 'n1',
        patientId: 'p1',
        patientNumber: 'PAT-2026-0001',
        patientName: 'Aminata Diallo',
        patientPhone: '77 123 45 67',
        type: 'CONFIRMATION',
        channel: 'SMS',
        message: 'Bonjour Aminata, votre rendez-vous est confirmé. DentalCare.',
        status: 'ENVOYE',
        sentAt: twoHoursAgo,
        createdAt: twoHoursAgo,
      },
      {
        id: 'n2',
        patientId: 'p2',
        patientNumber: 'PAT-2026-0002',
        patientName: 'Moussa Ndiaye',
        patientPhone: '76 234 56 78',
        type: 'RAPPEL',
        channel: 'WHATSAPP',
        message: 'Rappel : vous avez un rendez-vous prévu. DentalCare.',
        status: 'ENVOYE',
        sentAt: currentTime,
        createdAt: currentTime,
      },
      {
        id: 'n3',
        patientId: 'p3',
        patientNumber: 'PAT-2026-0003',
        patientName: 'Fatou Sow',
        patientPhone: '78 345 67 89',
        type: 'RAPPEL',
        channel: 'SMS',
        message: 'Rappel : vous avez un rendez-vous prévu. DentalCare.',
        status: 'ECHEC',
        errorMessage: 'Échec de simulation',
        createdAt: currentTime,
      },
    ];
  }
}
