export type NotificationType =
  | 'RAPPEL_RDV'
  | 'CONFIRMATION_RDV'
  | 'FACTURE'
  | 'RELANCE_PAIEMENT'
  | 'AUTRE';

export type NotificationChannel = 'SMS' | 'WHATSAPP' | 'EMAIL';
export type NotificationStatus = 'EN_ATTENTE' | 'ENVOYEE' | 'ECHEC';

export interface Notification {
  id: string;
  patientId: string;
  patientNumber?: string;
  patientName?: string;
  patientPhone?: string;
  type: NotificationType;
  channel: NotificationChannel;
  message: string;
  status: NotificationStatus;
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface NotificationCreateDto {
  patientId: string;
  patientNumber?: string;
  patientName?: string;
  patientPhone?: string;
  type: NotificationType;
  channel: NotificationChannel;
  message: string;
}
