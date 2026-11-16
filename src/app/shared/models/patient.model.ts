export type PatientStatus = 'ACTIF' | 'ARCHIVE';
export type PatientGender = 'M' | 'F';

export interface Patient {
  id: string;
  patientNumber: string;      // ex: PAT-2026-0001
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: PatientGender;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  lastConsultation?: string;
  status: PatientStatus;
}

export interface PatientCreateDto {
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: PatientGender;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface PatientUpdateDto extends Partial<PatientCreateDto> {}