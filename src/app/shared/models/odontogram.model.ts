export type ToothCondition =
  | 'SAINE' | 'CARIE' | 'ABSENTE' | 'EXTRAITE' | 'OBTURATION'
  | 'COURONNE' | 'IMPLANT' | 'ENDO' | 'FRACTURE' | 'MOBILITE' | 'PROTHESE';

export type ToothSurface = 'MESIAL' | 'DISTAL' | 'VESTIBULAR' | 'LINGUAL' | 'OCCLUSAL';

export interface DentalObservation {
  id: string;
  patientId: string;
  patientNumber: string;
  toothNumber: string; // FDI: 11-48
  surface?: ToothSurface;
  condition: ToothCondition;
  observation?: string;
  consultationId?: string;
  createdBy: string;
  createdAt: string;
}

export interface ToothState {
  toothNumber: string;
  currentCondition: ToothCondition;
  surfaces: Partial<Record<ToothSurface, ToothCondition>>;
  history: DentalObservation[];
}