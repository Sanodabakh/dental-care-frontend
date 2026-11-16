export type ConsultationStatus = 'BROUILLON' | 'VALIDEE';

export interface Consultation {
  id: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  dentistId: string;
  dentistName: string;
  appointmentId?: string;
  consultationDate: string;
  symptoms?: string;
  clinicalExam?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  observations?: string;
  status: ConsultationStatus;
  validatedAt?: string;
  createdAt: string;
}

export interface ConsultationCreateDto {
  patientId: string;
  patientNumber: string;
  dentistId: string;
  symptoms?: string;
  clinicalExam?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  observations?: string;
}