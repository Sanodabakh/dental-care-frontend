import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  LucideMessageSquare,
  LucidePlus,
  LucideRefreshCw,
  LucideX,
} from '@lucide/angular';
import { NotificationService } from '../notification.service';
import {
  Notification,
  NotificationStatus,
  NotificationType,
} from '../../../shared/models/notification.model';
import { DateFrPipe } from '../../../shared/pipes/date-fr.pipe';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, DateFrPipe,
    LucidePlus, LucideRefreshCw, LucideMessageSquare, LucideX,
  ],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css'],
})
export class NotificationListComponent implements OnInit {
  private readonly service = inject(NotificationService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly notifications = signal<Notification[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.list().subscribe({
      next: items => {
        this.notifications.set(items);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error instanceof Error ? error.message : 'Impossible de charger les notifications.');
        this.loading.set(false);
      },
    });
  }

  retry(notification: Notification): void {
    this.error.set('');
    this.service.retry(notification.id).subscribe({
      next: () => this.load(),
      error: error => this.error.set(
        error instanceof Error ? error.message : 'Impossible de relancer la notification.',
      ),
    });
  }

  statusLabel(status: NotificationStatus): string {
    const labels: Record<NotificationStatus, string> = {
      EN_ATTENTE: 'En attente',
      ENVOYE: 'Envoyé',
      ECHEC: 'Échec',
    };
    return labels[status];
  }

  statusClass(status: NotificationStatus): string {
    const classes: Record<NotificationStatus, string> = {
      EN_ATTENTE: 'dc-badge-warning',
      ENVOYE: 'dc-badge-success',
      ECHEC: 'dc-badge-danger',
    };
    return classes[status];
  }

  typeLabel(type: NotificationType): string {
    const labels: Record<NotificationType, string> = {
      CONFIRMATION: 'Confirmation',
      RAPPEL: 'Rappel',
      MODIFICATION: 'Modification',
      ANNULATION: 'Annulation',
      SUIVI: 'Suivi',
    };
    return labels[type];
  }
}
