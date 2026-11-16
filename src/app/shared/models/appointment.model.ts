export type AppointmentStatus =
  | 'EN_ATTENTE' | 'CONFIRME' | 'ARRIVE' | 'EN_CONSULTATION'
  | 'TERMINE' | 'ANNULE' | 'ABSENT' | 'REPORTE';

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  patientNumber?: string;
  dentistId: string;
  dentistName?: string;
  startTime: string;   // ISO: "2026-11-16T09:15:00"
  endTime: string;     // ISO
  motif: string;
  status: AppointmentStatus;
  observation?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppointmentCreateDto {
  patientId: string;
  patientName?: string;
  dentistId: string;
  dentistName?: string;
  startTime: string;
  endTime: string;
  motif: string;
  observation?: string;
}

export interface AppointmentUpdateDto extends Partial<AppointmentCreateDto> {
  status?: AppointmentStatus;
}