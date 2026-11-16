export interface Treatment {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  priceFcfa: number;
  estimatedDurationMin?: number;
  active: boolean;
  createdAt: string;
}

export interface TreatmentCreateDto {
  code: string;
  name: string;
  category: string;
  description?: string;
  priceFcfa: number;
  estimatedDurationMin?: number;
}