export type NotificationType =
  | 'CONFIRMATION'
  | 'RAPPEL'
  | 'MODIFICATION'
  | 'ANNULATION'
  | 'SUIVI';

export type NotificationChannel = 'SMS' | 'WHATSAPP';
export type NotificationStatus = 'EN_ATTENTE' | 'ENVOYE' | 'ECHEC';

export interface Notification {
  id: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  patientPhone: string;
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
  patientNumber: string;
  patientName: string;
  patientPhone: string;
  type: NotificationType;
  channel: NotificationChannel;
  message: string;
}
